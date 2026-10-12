package org.pocketfieldtrip.review;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.widget.Toast;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.Button;
import android.widget.TextView;
import android.graphics.Color;
import android.view.WindowInsets;
import android.print.PrintManager;
import android.print.PrintAttributes;
import java.io.*;
import java.util.*;
import org.json.JSONObject;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Debug review wrapper. HTTPS local assets; no file access, JS interfaces or runtime permissions. */
public final class MainActivity extends Activity {
  private static final String ORIGIN = "https://appassets.androidplatform.net";
  private static final int SAVE_FILE = 101, OPEN_FILE = 102;
  private static final int MAX_BYTES = 2 * 1024 * 1024;
  private WebView web;
  private LinearLayout navigation;
  private final Map<String, Button> tabs = new LinkedHashMap<>();
  private boolean backPending;
  private boolean transferBusy;
  private volatile boolean closed;
  private static final Object JOURNAL_LOCK = new Object();
  private static final Object EXPORT_LOCK = new Object(), IMPORT_LOCK = new Object();
  private static final Set<File> activeImports = new HashSet<>();
  private final Set<File> imports = new HashSet<>();
  private String exportToken, exportPhase;
  private final ExecutorService files = Executors.newSingleThreadExecutor();
  private String section = "explore";
  private String lastShell = "";
  private int dp(int n) { return Math.round(n * getResources().getDisplayMetrics().density); }
  private void navigate(String route) {
    web.evaluateJavascript("window.PocketAndroid?.navigate(" + JSONObject.quote(route) + ")", null);
  }
  private void shell(JSONObject data) {
    String route = data.optString("section", "explore");
    if (!tabs.containsKey(route)) route = "explore";
    String theme = data.optString("theme", "forest");
    if (!theme.equals("tidal") && !theme.equals("clay")) theme = "forest";
    boolean modal = data.optBoolean("modal");
    String signature = route + ":" + theme + ":" + modal;
    if (signature.equals(lastShell)) return;
    lastShell = signature; section = route;
    navigation.setVisibility(modal ? android.view.View.GONE : android.view.View.VISIBLE);
    int paper = Color.parseColor(theme.equals("tidal") ? "#ffffff" : theme.equals("clay") ? "#fffaf5" : "#fcfaf2");
    int ink = Color.parseColor(theme.equals("tidal") ? "#17222e" : theme.equals("clay") ? "#2a1e18" : "#203c32");
    int tint = Color.parseColor(theme.equals("tidal") ? "#e3ebf3" : theme.equals("clay") ? "#f5e3d4" : "#e7eddf");
    navigation.setBackgroundColor(paper);
    getWindow().setStatusBarColor(paper); getWindow().setNavigationBarColor(paper);
    for (Map.Entry<String, Button> item : tabs.entrySet()) {
      boolean selected = item.getKey().equals(section); Button button = item.getValue();
      button.setSelected(selected); button.setTextColor(ink);
      android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
      background.setColor(selected ? tint : paper); background.setCornerRadius(dp(16));
      android.graphics.drawable.RippleDrawable ripple = new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(tint), background, null);
      button.setBackground(ripple);
      button.setContentDescription(button.getText() + (selected ? ", selected" : ""));
    }
  }
  private volatile WebMessagePort port;
  private byte[] pendingBytes;
  private String pendingId;
  private ValueCallback<Uri[]> pendingOpen;
  private String deferredTransferState;
  private File stagedExport(String token) { return new File(getCacheDir(), "pft-export-" + token + ".pending"); }
  private boolean ownsExport(String token) {
    return token != null && token.equals(getPreferences(MODE_PRIVATE).getString("pending-export-token", null));
  }
  private void clearExport() {
    clearExport(exportToken);
  }
  private void clearExport(String token) {
    synchronized (EXPORT_LOCK) {
      if (token != null) stagedExport(token).delete();
      if (ownsExport(token)) getPreferences(MODE_PRIVATE).edit().clear().commit();
      if (Objects.equals(token, exportToken)) {
        pendingBytes = null; pendingId = null; exportToken = null; exportPhase = null;
      }
    }
  }
  private void cleanImports() {
    synchronized (IMPORT_LOCK) {
      for (File file : imports) { file.delete(); activeImports.remove(file); }
      imports.clear();
    }
  }
  private boolean allowedDocument(Uri uri, int mode) {
    if (uri == null || !"content".equals(uri.getScheme())) return false;
    String authority = uri.getAuthority();
    if (authority == null || authority.isEmpty() || authority.contains("@") || authority.equals(getPackageName()) || authority.startsWith(getPackageName() + ".")) return false;
    android.content.pm.ProviderInfo provider = getPackageManager().resolveContentProvider(authority, 0);
    if (provider != null && provider.applicationInfo.uid == android.os.Process.myUid()) return false;
    return checkUriPermission(uri, android.os.Process.myPid(), android.os.Process.myUid(), mode) == android.content.pm.PackageManager.PERMISSION_GRANTED;
  }

  @Override public void onCreate(Bundle saved) {
    super.onCreate(saved);
    synchronized (EXPORT_LOCK) {
      String token = getPreferences(MODE_PRIVATE).getString("pending-export-token", null);
      String phase = getPreferences(MODE_PRIVATE).getString("pending-export-phase", null);
      if (saved != null && token != null && token.matches("[a-f0-9-]{36}") && token.equals(saved.getString("picker-token")) && "picker".equals(phase)) {
        exportToken = token; exportPhase = phase;
        pendingId = getPreferences(MODE_PRIVATE).getString("pending-export-id", null);
        try { pendingBytes = readAll(new FileInputStream(stagedExport(token))); }
        catch (IOException error) { clearExport(); deferredTransferState = "interrupted"; }
      } else {
        if (token != null || (saved != null && saved.getBoolean("transfer-interrupted"))) deferredTransferState = "interrupted";
        getPreferences(MODE_PRIVATE).edit().clear().commit();
        File[] abandoned = getCacheDir().listFiles((dir, name) -> name.startsWith("pft-export-") || name.equals("pft-export.pending"));
        if (abandoned != null) for (File file : abandoned) file.delete();
      }
    }
    synchronized (IMPORT_LOCK) {
      File[] abandoned = getCacheDir().listFiles((dir, name) -> name.startsWith("pft-import-"));
      if (abandoned != null) for (File file : abandoned) if (!activeImports.contains(file)) file.delete();
    }
    web = new WebView(this);
    FrameLayout frame = new FrameLayout(this);
    LinearLayout content = new LinearLayout(this);
    content.setOrientation(LinearLayout.VERTICAL);
    content.addView(web, new LinearLayout.LayoutParams(-1, 0, 1));
    navigation = new LinearLayout(this);
    navigation.setBackgroundColor(Color.rgb(242, 239, 229));
    for (String route : new String[]{"explore", "trip", "notebook"}) {
      Button tab = new Button(this); tab.setAllCaps(false);
      tab.setText(route.equals("explore") ? "Explore" : route.equals("trip") ? "Trip" : "Notebook");
      tab.setMinHeight(dp(52)); tab.setMinimumWidth(0); tab.setTextSize(14); tab.setPadding(dp(8), dp(10), dp(8), dp(10));
      tab.setMaxLines(1); tab.setEllipsize(android.text.TextUtils.TruncateAt.END);
      tab.setAutoSizeTextTypeUniformWithConfiguration(12, 14, 1, android.util.TypedValue.COMPLEX_UNIT_SP);
      tab.setOnClickListener(v -> { v.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY); navigate(route); });
      navigation.addView(tab, new LinearLayout.LayoutParams(0, -2, 1)); tabs.put(route, tab);
    }
    content.addView(navigation, new LinearLayout.LayoutParams(-1, -2));
    frame.addView(content, new FrameLayout.LayoutParams(-1, -1));
    setContentView(frame);
    frame.setOnApplyWindowInsetsListener((view, insets) -> {
      int left, top, right, bottom;
      if (android.os.Build.VERSION.SDK_INT >= 30) {
        android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
        left = safe.left; top = safe.top; right = safe.right; bottom = safe.bottom;
      } else {
        left = insets.getSystemWindowInsetLeft(); top = insets.getSystemWindowInsetTop(); right = insets.getSystemWindowInsetRight(); bottom = insets.getSystemWindowInsetBottom();
      }
      view.setPadding(left, top, right, bottom);
      return insets;
    });
    if (android.os.Build.VERSION.SDK_INT >= 30)
      getWindow().getInsetsController().setSystemBarsAppearance(24, 24);
    else getWindow().getDecorView().setSystemUiVisibility(0x2000 | 0x10);
    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));
    settings.setUserAgentString(settings.getUserAgentString() + " PocketFieldTripApp/0.3.0");
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    WebView.setWebContentsDebuggingEnabled(true);
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
        if (port != null) { port.close(); port = null; }
        content.removeView(view); view.destroy(); web = null;
        navigation.setVisibility(android.view.View.GONE);
        TextView explanation = new TextView(MainActivity.this);
        explanation.setText("The guide stopped rendering. Saved notes and private draft recovery have not been intentionally removed. Recover the guide to read local records; unsaved intent is not stored.");
        explanation.setTextSize(18); explanation.setPadding(dp(24), dp(32), dp(24), dp(24));
        Button recover = new Button(MainActivity.this); recover.setText("Recover guide"); recover.setAllCaps(false);
        recover.setOnClickListener(v -> { Intent next = new Intent(MainActivity.this, MainActivity.class); finish(); startActivity(next); });
        content.addView(explanation, new LinearLayout.LayoutParams(-1, -2));
        content.addView(recover, new LinearLayout.LayoutParams(-1, -2));
        return true;
      }
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) { return local(request); }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        if (!localOrigin(request.getUrl())) {
          Toast.makeText(MainActivity.this, "This private offline App opens only its bundled guide.", Toast.LENGTH_SHORT).show();
          return true;
        }
        return false;
      }
      @Override public void onPageFinished(WebView view, String url) {
        if (!localOrigin(Uri.parse(url))) return;
        try {
          String buildInfo = new String(readAll(getAssets().open("build-info.json")), java.nio.charset.StandardCharsets.UTF_8);
          web.evaluateJavascript("window.__pftInstalledBuild=" + new JSONObject(buildInfo).toString() + ";", null);
          String updateUI = new String(readAll(getAssets().open("update-notice.js")), java.nio.charset.StandardCharsets.UTF_8);
          web.evaluateJavascript(updateUI, null);
          String script = new String(readAll(getAssets().open("native-support.js")), java.nio.charset.StandardCharsets.UTF_8);
          connectWhenReady(view, script, 0);
        } catch (Exception error) { Toast.makeText(MainActivity.this, "Native file support could not start.", Toast.LENGTH_LONG).show(); }
      }
    });
    ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) { return local(request); }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
        if (pendingOpen != null || pendingBytes != null || transferBusy) { callback.onReceiveValue(null); return true; }
        cleanImports();
        pendingOpen = callback;
        // Providers may label a valid .json backup as text or generic binary.
        // The unchanged web JSON parser validates the selected contents.
        Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        try { startActivityForResult(pick, OPEN_FILE); }
        catch (RuntimeException error) { pendingOpen.onReceiveValue(null); pendingOpen = null; }
        return true;
      }
    });
    if (android.os.Build.VERSION.SDK_INT >= 33)
      getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
    web.loadUrl(ORIGIN + "/index.html");
  }
  private void connectWhenReady(WebView view, String script, int attempt) {
    if (closed || view != web) return;
    view.evaluateJavascript("!!document.getElementById('install-app-status')", result -> {
      if (closed || view != web) return;
      if ("true".equals(result)) view.evaluateJavascript(script, ignored -> { if (!closed && view == web) connectPort(); });
      else if (attempt < 100) view.postDelayed(() -> connectWhenReady(view, script, attempt + 1), 50);
      else Toast.makeText(MainActivity.this, "Device notebook support did not start. Keep any draft and reopen the guide.", Toast.LENGTH_LONG).show();
    });
  }
  private static boolean localOrigin(Uri uri) {
    return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost()) && uri.getPort() == -1;
  }
  private WebResourceResponse local(WebResourceRequest request) {
    Uri uri = request.getUrl();
    if (!localOrigin(uri)) return errorResponse();
    String path = uri.getPath();
    if (!"GET".equals(request.getMethod()) || path == null || path.contains("\\") || Arrays.asList(path.split("/")).contains("..")) return errorResponse();
    if ("/".equals(path)) path = "/index.html";
    if ("/native-journal.json".equals(path)) {
      try {
        synchronized (JOURNAL_LOCK) {
          JSONObject state = readJournal();
          return new WebResourceResponse("application/json", "UTF-8", 200, "OK", Collections.singletonMap("Cache-Control", "no-store"), new ByteArrayInputStream(state.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        }
      } catch (Exception error) { return new WebResourceResponse("application/json", "UTF-8", 503, "Unavailable", Collections.emptyMap(), new ByteArrayInputStream(new byte[0])); }
    }
    try {
      InputStream stream = getAssets().open("web" + path, android.content.res.AssetManager.ACCESS_STREAMING);
      String mime = path.endsWith(".wasm") ? "application/wasm" : path.endsWith(".js") || path.endsWith(".mjs") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : path.endsWith(".json") ? "application/json" : path.endsWith(".webmanifest") ? "application/manifest+json" : path.endsWith(".svg") ? "image/svg+xml" : path.endsWith(".png") ? "image/png" : path.endsWith(".onnx") ? "application/octet-stream" : "text/plain";
      return new WebResourceResponse(mime, mime.startsWith("text/") || mime.contains("json") ? "UTF-8" : null, 200, "OK", Collections.singletonMap("Cache-Control", "no-cache"), stream);
    } catch (IOException error) { return errorResponse(); }
  }
  private static WebResourceResponse errorResponse() {
    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
  }
  private void connectPort() {
    if (port != null) port.close();
    WebMessagePort[] ports = web.createWebMessageChannel();
    port = ports[0];
    port.setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
      @Override public void onMessage(WebMessagePort source, WebMessage message) {
        String id = "";
        try {
          if (message.getData() == null || message.getData().length() > MAX_BYTES * 2) throw new IOException("Message too large");
          JSONObject data = new JSONObject(message.getData());
          if ("shell".equals(data.optString("type"))) { shell(data); return; }
          id = data.getString("id");
          if ("journal".equals(data.optString("type"))) {
            if (!id.matches("[a-f0-9-]{36}")) throw new IOException("Invalid journal request.");
            final String journalId = id;
            final WebMessagePort journalPort = source;
            files.execute(() -> {
              String state = "journal-failed";
              try { writeJournal(data, journalPort); state = "journal-saved"; }
              catch (Exception error) { /* No durable receipt on failure or uncertain write. */ }
              final String result = state;
              runOnUiThread(() -> { if (!closed && port == journalPort) reply(journalId, result); });
            });
            return;
          }
          if ("print".equals(data.getString("type"))) {
            PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
            if (manager == null) { reply(id, "print-failed"); return; }
            manager.print("Pocket Field Trip", web.createPrintDocumentAdapter("Pocket Field Trip"), new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A5).build());
            return;
          }
          if (!"save".equals(data.getString("type")) || id.length() > 80) throw new IOException("Invalid file request.");
          if (pendingBytes != null || transferBusy || pendingOpen != null) { reply(id, "busy"); return; }
          String encoded = data.getString("base64");
          if (encoded.length() > MAX_BYTES * 4 / 3 + 8) throw new IOException("File is too large for this review build.");
          byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
          if (bytes.length > MAX_BYTES) throw new IOException("File is too large.");
          String name = data.getString("name").replaceAll("[^A-Za-z0-9._-]", "_");
          if (name.isEmpty() || name.length() > 160) throw new IOException("Invalid filename.");
          String mime = name.endsWith(".json") ? "application/json" : name.endsWith(".pdf") ? "application/pdf" : "text/plain";
          pendingBytes = bytes; pendingId = id;
          exportToken = UUID.randomUUID().toString(); exportPhase = "staging";
          transferBusy = true;
          final String requestId = id, token = exportToken;
          synchronized (EXPORT_LOCK) {
            if (!getPreferences(MODE_PRIVATE).edit().putString("pending-export-id", id).putString("pending-export-token", token).putString("pending-export-phase", "staging").commit()) throw new IOException("Export could not be staged.");
          }
          files.execute(() -> {
            try {
              synchronized (EXPORT_LOCK) {
                if (closed || !ownsExport(token)) return;
                try (OutputStream staged = new FileOutputStream(stagedExport(token))) { staged.write(bytes); }
              }
              runOnUiThread(() -> {
                transferBusy = false;
                if (closed || !token.equals(exportToken)) { clearExport(token); return; }
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE, name);
                try {
                  synchronized (EXPORT_LOCK) {
                    if (!ownsExport(token)) { clearExport(token); return; }
                    if (!getPreferences(MODE_PRIVATE).edit().putString("pending-export-phase", "picker").commit()) throw new IOException("Picker state could not be retained.");
                    startActivityForResult(save, SAVE_FILE);
                    exportPhase = "picker";
                  }
                }
                catch (RuntimeException error) { clearExport(); reply(requestId, "failed"); }
                catch (IOException error) { clearExport(); reply(requestId, "interrupted"); }
              });
            } catch (Exception error) {
              runOnUiThread(() -> { if (closed || !token.equals(exportToken)) { clearExport(token); return; } transferBusy = false; clearExport(); reply(requestId, "failed"); });
            }
          });
        } catch (Exception error) {
          if (id.equals(pendingId)) { transferBusy = false; clearExport(); }
          reply(id, "failed");
        }
      }
    });
    web.postWebMessage(new WebMessage("pft-native-port", new WebMessagePort[]{ ports[1] }), Uri.parse(ORIGIN));
    if (deferredTransferState != null) {
      String state = deferredTransferState; deferredTransferState = null;
      reply("", state);
    }
  }
  private android.util.AtomicFile journalFile() { return new android.util.AtomicFile(new File(getFilesDir(), "pft-journal.json")); }
  private JSONObject readJournal() throws Exception {
    android.util.AtomicFile file = journalFile();
    if (!file.getBaseFile().exists() && !new File(file.getBaseFile().getPath() + ".bak").exists())
      return new JSONObject().put("initialized", false);
    String text = new String(readAll(file.openRead()), java.nio.charset.StandardCharsets.UTF_8);
    JSONObject state = new JSONObject(text);
    if (state.optInt("schema") != 1 || !state.has("raw") || !(state.isNull("raw") || state.get("raw") instanceof String)) throw new IOException("Unreadable private journal.");
    return state.put("initialized", true);
  }
  private void writeJournal(JSONObject request, WebMessagePort owner) throws Exception {
    synchronized (JOURNAL_LOCK) {
      if (closed || port != owner) throw new IOException("Journal owner expired.");
      if (!request.has("raw") || !request.has("expected") || !(request.isNull("raw") || request.get("raw") instanceof String) || !(request.isNull("expected") || request.get("expected") instanceof String)) throw new IOException("Invalid journal state.");
      JSONObject previous = readJournal();
      String raw = request.isNull("raw") ? null : request.getString("raw");
      String expected = request.isNull("expected") ? null : request.getString("expected");
      String prior = previous.optBoolean("initialized") && !previous.isNull("raw") ? previous.getString("raw") : null;
      if (previous.optBoolean("initialized") && !Objects.equals(prior, expected)) throw new IOException("Journal changed.");
      if (raw != null) new JSONObject(raw);
      byte[] bytes = new JSONObject().put("schema", 1).put("raw", raw == null ? JSONObject.NULL : raw).toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
      if (bytes.length > MAX_BYTES) throw new IOException("Journal too large.");
      android.util.AtomicFile file = journalFile();
      FileOutputStream output = null;
      try {
        output = file.startWrite(); output.write(bytes); output.getFD().sync();
        file.finishWrite(output); output = null;
        if (!Arrays.equals(bytes, readAll(file.openRead()))) throw new IOException("Journal readback differed.");
      } catch (Exception error) { if (output != null) file.failWrite(output); throw error; }
    }
  }
  private void reply(String id, String state) {
    if (closed) return;
    if (port == null) { deferredTransferState = state; return; }
    try { if (port != null) port.postMessage(new WebMessage(new JSONObject().put("id", id).put("state", state).toString())); }
    catch (Exception ignored) {}
  }
  @Override protected void onActivityResult(int request, int result, Intent data) {
    super.onActivityResult(request, result, data);
    if (request == OPEN_FILE) {
      final ValueCallback<Uri[]> callback = pendingOpen;
      if (callback == null) { Toast.makeText(this, "Import was interrupted. Your notebook stays here; choose the file again.", Toast.LENGTH_LONG).show(); return; }
      if (result != RESULT_OK) { pendingOpen = null; callback.onReceiveValue(null); return; }
      final Uri source = data == null ? null : data.getData();
      if (!allowedDocument(source, Intent.FLAG_GRANT_READ_URI_PERMISSION)) {
        pendingOpen = null; callback.onReceiveValue(null);
        Toast.makeText(this, "Choose an accessible document through the system picker. Your notebook stays here.", Toast.LENGTH_LONG).show(); return;
      }
      transferBusy = true;
      files.execute(() -> {
        File copy = null;
        try {
          byte[] bytes = readAll(getContentResolver().openInputStream(source));
          synchronized (IMPORT_LOCK) {
            if (closed) return;
            copy = File.createTempFile("pft-import-", ".json", getCacheDir());
            imports.add(copy); activeImports.add(copy);
            try (OutputStream out = new FileOutputStream(copy)) { out.write(bytes); }
          }
        } catch (Exception error) {
          if (copy != null) { synchronized (IMPORT_LOCK) { copy.delete(); imports.remove(copy); activeImports.remove(copy); } }
          copy = null;
        }
        final File staged = copy;
        runOnUiThread(() -> {
          if (closed || pendingOpen != callback) {
            if (staged != null) { synchronized (IMPORT_LOCK) { staged.delete(); imports.remove(staged); activeImports.remove(staged); } }
            return;
          }
          pendingOpen = null; transferBusy = false;
          callback.onReceiveValue(staged == null ? null : new Uri[]{Uri.fromFile(staged)});
          if (staged == null) Toast.makeText(this, "The document could not be read within the 2 MiB limit. Your notebook stays here.", Toast.LENGTH_LONG).show();
        });
      });
    }
    if (request == SAVE_FILE) {
      if (!"picker".equals(exportPhase)) return;
      final byte[] bytes = pendingBytes; final String id = pendingId;
      if (bytes == null) { clearExport(); reply(id, "failed"); return; }
      if (result != RESULT_OK || data == null || data.getData() == null) { clearExport(); reply(id, "cancelled"); return; }
      final Uri destination = data.getData(); transferBusy = true;
      if (!allowedDocument(destination, Intent.FLAG_GRANT_WRITE_URI_PERMISSION)) { transferBusy = false; clearExport(); reply(id, "failed"); return; }
      final String token = exportToken;
      synchronized (EXPORT_LOCK) {
        exportPhase = "writing";
        if (!ownsExport(token) || !getPreferences(MODE_PRIVATE).edit().putString("pending-export-phase", "writing").commit()) { transferBusy = false; clearExport(); reply(id, "interrupted"); return; }
      }
      files.execute(() -> {
        synchronized (EXPORT_LOCK) { if (closed || !ownsExport(token)) return; }
        String state = "failed";
        try (OutputStream stream = getContentResolver().openOutputStream(destination, "w")) {
          if (stream == null) throw new IOException("Destination unavailable");
          stream.write(bytes); state = "written-unverified";
        } catch (Exception error) { state = "written-unverified"; }
        if ("written-unverified".equals(state)) {
          try { if (Arrays.equals(bytes, readAll(getContentResolver().openInputStream(destination)))) state = "saved"; }
          catch (Exception ignored) {}
        }
        final String outcome = state;
        runOnUiThread(() -> { if (closed || !token.equals(exportToken)) { clearExport(token); return; } transferBusy = false; clearExport(); reply(id, outcome); });
      });
    }
  }
  private void handleBack() {
    if (web == null) { moveTaskToBack(true); return; }
    if (backPending) return;
    backPending = true;
    web.evaluateJavascript("window.PocketAndroid?.back() || false", value -> {
      backPending = false;
      if (!"true".equals(value)) moveTaskToBack(true);
    });
  }
  @Override public void onBackPressed() { handleBack(); }
  private static byte[] readAll(InputStream input) throws IOException {
    if (input == null) throw new IOException("Source unavailable");
    try (InputStream source = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      byte[] buffer = new byte[8192]; int count;
      while ((count = source.read(buffer)) != -1) {
        if (out.size() + count > MAX_BYTES) throw new IOException("Read limit exceeded");
        out.write(buffer, 0, count);
      }
      return out.toByteArray();
    }
  }
  @Override protected void onPause() {
    if (web != null) {
      web.evaluateJavascript("window.dispatchEvent(new CustomEvent('pft-native-lifecycle',{detail:'paused'}))", null);
      web.onPause();
    }
    super.onPause();
  }
  @Override protected void onResume() {
    super.onResume(); if (web != null) {
      web.onResume();
      web.evaluateJavascript("window.dispatchEvent(new CustomEvent('pft-native-lifecycle',{detail:'resumed'}))", null);
    }
  }
  @Override protected void onDestroy() {
    closed = true;
    if (pendingOpen != null) { pendingOpen.onReceiveValue(null); pendingOpen = null; }
    cleanImports();
    if (!"picker".equals(exportPhase)) clearExport();
    if (port != null) port.close();
    files.shutdown(); if (web != null) web.destroy(); super.onDestroy();
  }
  @Override protected void onSaveInstanceState(Bundle state) {
    super.onSaveInstanceState(state);
    if ("picker".equals(exportPhase)) state.putString("picker-token", exportToken);
    else if (pendingBytes != null || transferBusy || pendingOpen != null) state.putBoolean("transfer-interrupted", true);
  }
}
