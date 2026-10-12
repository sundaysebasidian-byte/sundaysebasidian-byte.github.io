package org.pocketfieldtrip.securitytest;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import java.io.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.json.*;

/** Test-only APK: runs against the packaged debug app in an owned emulator. */
public final class BoundaryInstrumentation extends Instrumentation {
  private final JSONObject result = new JSONObject();
  private Activity activity;
  private Class<?> host;
  private Object get(Object instance, String name) throws Exception { Field f = host.getDeclaredField(name); f.setAccessible(true); return f.get(instance); }
  private void set(Object instance, String name, Object value) throws Exception { Field f = host.getDeclaredField(name); f.setAccessible(true); f.set(instance, value); }
  private Object call(Object instance, String name, Class<?>[] types, Object... args) throws Exception { Method m = host.getDeclaredMethod(name, types); m.setAccessible(true); return m.invoke(instance, args); }
  private void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
  private void ui(Runnable action) { runOnMainSync(action); }
  private void record(String key, Object value) throws Exception { result.put(key, value); }
  private android.content.SharedPreferences prefs(Activity a) { return a.getPreferences(0); }
  private void seed(Activity a, String token, String phase) throws Exception {
    set(a, "pendingBytes", "synthetic export".getBytes("UTF-8")); set(a, "pendingId", "test-id");
    set(a, "exportToken", token); set(a, "exportPhase", phase);
    prefs(a).edit().putString("pending-export-id", "test-id").putString("pending-export-token", token).putString("pending-export-phase", phase).commit();
    try (FileOutputStream out = new FileOutputStream(new File(a.getCacheDir(), "pft-export-" + token + ".pending"))) { out.write("synthetic export".getBytes("UTF-8")); }
  }
  private Activity recreate(Activity old) throws Exception {
    ActivityMonitor monitor = addMonitor(host.getName(), null, false);
    ui(old::recreate);
    Activity next = monitor.waitForActivityWithTimeout(15000); removeMonitor(monitor);
    check(next != null && next != old, "Activity must really recreate");
    waitForIdleSync(); return next;
  }
  private void deliver(Activity a, int request, Uri uri) throws Exception {
    AtomicReference<Throwable> error = new AtomicReference<>();
    ui(() -> { try { call(a, "onActivityResult", new Class<?>[]{int.class,int.class,Intent.class}, request, Activity.RESULT_OK, new Intent().setData(uri).addFlags(3)); } catch (Throwable t) { error.set(t); } });
    if (error.get() != null) throw new Exception(error.get());
  }
  private String js(Activity a, String expression) throws Exception {
    CountDownLatch ready = new CountDownLatch(1); AtomicReference<String> value = new AtomicReference<>();
    ui(() -> { try { ((WebView)get(a,"web")).evaluateJavascript(expression, v -> { value.set(v); ready.countDown(); }); } catch (Exception e) { ready.countDown(); } });
    check(ready.await(10, TimeUnit.SECONDS), "JS callback timed out"); return value.get();
  }
  private void waitBridge(Activity a) throws Exception { long end=System.currentTimeMillis()+15000; while(System.currentTimeMillis()<end){if("true".equals(js(a,"!!window.__pftNativeSend")))return;Thread.sleep(100);}throw new AssertionError("Bridge unavailable"); }
  private Uri fixture(String path){return Uri.parse("content://org.pocketfieldtrip.securitytest.documents/"+path);}
  private boolean providerFlag(String key)throws Exception{try(android.database.Cursor c=activity.getContentResolver().query(fixture("status"),null,null,null,null)){return c.moveToFirst() && c.getInt(c.getColumnIndexOrThrow(key))==1;}}
  private void release(String path){try(android.database.Cursor c=activity.getContentResolver().query(fixture(path),null,null,null,null)){} }
  private void awaitFlag(String key)throws Exception{long end=System.currentTimeMillis()+10000;while(System.currentTimeMillis()<end){if(providerFlag(key))return;Thread.sleep(50);}throw new AssertionError("Provider flag timed out: "+key);}
  @Override public void onCreate(Bundle arguments) { super.onCreate(arguments); start(); }
  @Override public void onStart() {
    Bundle output = new Bundle(); int status = Activity.RESULT_OK;
    try {
      host = Class.forName("org.pocketfieldtrip.review.MainActivity");
      activity = startActivitySync(new Intent().setClassName("org.pocketfieldtrip.review", host.getName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
      waitBridge(activity);
      // Injection reaches the packaged native result handler. It is not a hostile chooser installation.
      JSONArray rejected = new JSONArray();
      String[] uris = {"file:///data/user/0/org.pocketfieldtrip.review/shared_prefs/org.pocketfieldtrip.review.MainActivity.xml", "android.resource://org.pocketfieldtrip.review/raw/private", "https://external.invalid/backup.json", "content://org.pocketfieldtrip.review/private", "content://org.pocketfieldtrip.review.provider/private", "content://missing.provider/backup", "content://10@missing.provider/backup", "content:///backup"};
      File sentinel = new File(activity.getFilesDir(), "security-sentinel");
      try(FileOutputStream out=new FileOutputStream(sentinel)){out.write("KEEP".getBytes("UTF-8"));}
      for (String raw : uris) {
        Uri uri = Uri.parse(raw); AtomicInteger count = new AtomicInteger(); AtomicReference<Uri[]> selected = new AtomicReference<>();
        ValueCallback<Uri[]> callback = value -> { count.incrementAndGet(); selected.set(value); };
        set(activity,"pendingOpen",callback); deliver(activity,102,uri);
        check(count.get()==1 && selected.get()==null && get(activity,"pendingOpen")==null,"Import URI must be cancelled exactly once: "+raw);
        String token=UUID.randomUUID().toString(); seed(activity,token,"picker"); deliver(activity,101,uri);
        check(get(activity,"pendingBytes")==null && !prefs(activity).contains("pending-export-token"),"Export URI must be rejected: "+raw);
        rejected.put(raw);
      }
      String token=UUID.randomUUID().toString();seed(activity,token,"picker");deliver(activity,101,Uri.fromFile(sentinel));
      try(FileInputStream in=new FileInputStream(sentinel)){check(in.read()=='K' && in.read()=='E' && in.read()=='E' && in.read()=='P' && in.read()==-1,"Forged file result must not overwrite private sentinel");}sentinel.delete();
      record("rejectedImportAndExportUris", rejected); record("privateSentinelUnchanged",true);
      byte[] exact = new byte[2*1024*1024];
      check(((byte[])call(null,"readAll",new Class<?>[]{InputStream.class},new ByteArrayInputStream(exact))).length==exact.length,"Exact byte limit should read");
      boolean oversized=false;try{call(null,"readAll",new Class<?>[]{InputStream.class},new ByteArrayInputStream(new byte[exact.length+1]));}catch(InvocationTargetException e){oversized=e.getCause() instanceof IOException;}
      check(oversized,"Actual byte limit must reject oversized stream");record("packagedReadLimit",true);
      // Queue a real bridge export behind a latch, then recreate while staging is outstanding.
      Activity old=activity; CountDownLatch unblock=new CountDownLatch(1);
      ((ExecutorService)get(old,"files")).execute(()->{try{unblock.await(15,TimeUnit.SECONDS);}catch(InterruptedException ignored){}});
      js(old,"window.__pftNativeSend({type:'save',id:'queued-stage',name:'stage.json',base64:btoa('{}')});true");
      long end=System.currentTimeMillis()+10000;while(!"staging".equals(prefs(old).getString("pending-export-phase",null))&&System.currentTimeMillis()<end)Thread.sleep(50);
      check("staging".equals(prefs(old).getString("pending-export-phase",null)),"Real bridge export must enter staging");
      activity=recreate(old);unblock.countDown();waitBridge(activity);Thread.sleep(250);
      check(get(activity,"pendingBytes")==null && !prefs(activity).contains("pending-export-token"),"Staging recreation must not remain busy");
      check(js(activity,"document.getElementById('native-transfer-status').textContent").contains("interrupted"),"Interrupted staging must be announced");record("realQueuedStagingRecreation",true);
      // Deterministic writing-state recreation and stale completion against a new owner.
      old=activity;String oldToken=UUID.randomUUID().toString();seed(old,oldToken,"writing");activity=recreate(old);waitBridge(activity);
      check(get(activity,"pendingBytes")==null && !prefs(activity).contains("pending-export-token"),"Writing recreation must not remain busy");
      String newToken=UUID.randomUUID().toString();seed(activity,newToken,"picker");
      call(old,"clearExport",new Class<?>[]{String.class},oldToken);
      check(newToken.equals(prefs(activity).getString("pending-export-token",null)) && get(activity,"pendingBytes")!=null,"Stale completion must not clear newer transfer");
      call(activity,"clearExport",new Class<?>[0]);record("seededWritingRecreationAndStaleCleanup",true);
      // Real picker-token save/restore contract through actual Activity recreation.
      token=UUID.randomUUID().toString();seed(activity,token,"picker");activity=recreate(activity);waitBridge(activity);
      check(token.equals(get(activity,"exportToken")) && get(activity,"pendingBytes")!=null,"Saved picker token must restore");
      ui(()->{try{call(activity,"onActivityResult",new Class<?>[]{int.class,int.class,Intent.class},101,Activity.RESULT_CANCELED,null);}catch(Exception e){throw new RuntimeException(e);}});
      check(get(activity,"pendingBytes")==null,"Restored picker cancel must unlock");record("seededPickerTokenRecreation",true);
      AtomicInteger cancelled=new AtomicInteger();set(activity,"pendingOpen",(ValueCallback<Uri[]>)(value)->{check(value==null,"Recreated import must cancel");cancelled.incrementAndGet();});
      activity=recreate(activity);waitBridge(activity);check(cancelled.get()==1,"Import recreation callback must be exactly once");record("pendingImportRecreationCancelledOnce",true);
      // A separate fixture process/UID supplies real explicitly granted content URIs.
      getContext().startActivity(new Intent().setClassName("org.pocketfieldtrip.securitytest","org.pocketfieldtrip.securitytest.GrantActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
      end=System.currentTimeMillis()+10000;while(activity.checkUriPermission(fixture("valid"),android.os.Process.myPid(),android.os.Process.myUid(),3)!=android.content.pm.PackageManager.PERMISSION_GRANTED&&System.currentTimeMillis()<end)Thread.sleep(50);
      check(activity.checkUriPermission(fixture("valid"),android.os.Process.myPid(),android.os.Process.myUid(),3)==android.content.pm.PackageManager.PERMISSION_GRANTED,"External fixture grant must exist");
      for(String path:new String[]{"valid","oversize"}){
        CountDownLatch done=new CountDownLatch(1);AtomicReference<Uri[]> selected=new AtomicReference<>();AtomicInteger count=new AtomicInteger();
        set(activity,"pendingOpen",(ValueCallback<Uri[]>)(value)->{selected.set(value);count.incrementAndGet();done.countDown();});deliver(activity,102,fixture(path));
        check(done.await(10,TimeUnit.SECONDS)&&count.get()==1,"Native import must complete exactly once");
        if(path.equals("valid")){check(selected.get()!=null && "file".equals(selected.get()[0].getScheme()),"Provider URI must become an owner-created private copy");File copy=new File(selected.get()[0].getPath());check(copy.getCanonicalPath().startsWith(activity.getCacheDir().getCanonicalPath()+"/pft-import-")&&copy.length()==2,"Private copy must contain bounded actual bytes");}
        else check(selected.get()==null,"Provider misreporting zero size must still reject >2MiB bytes");
      }
      record("realExternalProviderBoundedCopyAndOversize",true);
      old=activity;CountDownLatch readDone=new CountDownLatch(1);AtomicInteger readCount=new AtomicInteger();
      set(old,"pendingOpen",(ValueCallback<Uri[]>)(value)->{check(value==null,"Interrupted read must not expose a stale copy");readCount.incrementAndGet();readDone.countDown();});deliver(old,102,fixture("slow-read"));awaitFlag("read_opened");
      activity=recreate(old);waitBridge(activity);release("release-read");check(readDone.await(5,TimeUnit.SECONDS),"Interrupted import must cancel");Thread.sleep(300);check(readCount.get()==1 && get(activity,"pendingOpen")==null,"Stale import callback must not repeat");record("realProviderReadRecreation",true);
      old=activity;oldToken=UUID.randomUUID().toString();seed(old,oldToken,"picker");set(old,"pendingBytes",new byte[2*1024*1024]);deliver(old,101,fixture("slow-write"));awaitFlag("write_opened");
      check("writing".equals(get(old,"exportPhase")),"Real provider write must be outstanding");activity=recreate(old);waitBridge(activity);
      check(get(activity,"pendingBytes")==null,"Actual writing recreation must unlock");newToken=UUID.randomUUID().toString();seed(activity,newToken,"picker");release("release-write");Thread.sleep(500);
      check(newToken.equals(prefs(activity).getString("pending-export-token",null)),"Actual stale writer must not clear new owner");call(activity,"clearExport",new Class<?>[0]);record("realProviderWriteRecreationAndNewOwner",true);
      record("passed",true);record("scope","Packaged app on task-owned Android16 ARM64 emulator. Synthetic native callback injection, granted external fixture provider, actual queued staging/provider read/provider write Activity recreation; seeded picker restoration plus separate real system-picker suite. No hostile picker installation or physical-phone claim.");
    } catch(Throwable error) { status=Activity.RESULT_CANCELED;try{result.put("passed",false).put("error",error.toString());StringWriter trace=new StringWriter();error.printStackTrace(new PrintWriter(trace));result.put("stack",trace.toString());}catch(Exception ignored){} }
    output.putString("report",result.toString());finish(status,output);
  }
}
