package org.pocketfieldtrip.securitytest;

import android.app.*;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.*;
import java.io.*;
import java.lang.reflect.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.json.*;

/** Private deterministic native storage test. Synthetic request calls the production writer. */
public final class JournalBoundaryInstrumentation extends Instrumentation {
  private Class<?> host;
  private Object get(Activity a, String name) throws Exception {
    Field f = host.getDeclaredField(name); f.setAccessible(true); return f.get(a);
  }
  private Object call(Activity a, String name, Class<?>[] types, Object... args) throws Exception {
    Method m = host.getDeclaredMethod(name, types); m.setAccessible(true); return m.invoke(a, args);
  }
  private void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
  private String js(Activity a, String expression) throws Exception {
    CountDownLatch ready = new CountDownLatch(1); AtomicReference<String> value = new AtomicReference<>();
    runOnMainSync(() -> { try { ((WebView)get(a, "web")).evaluateJavascript(expression, v -> { value.set(v); ready.countDown(); }); } catch (Exception e) { ready.countDown(); } });
    check(ready.await(10, TimeUnit.SECONDS), "JS callback timed out"); return value.get();
  }
  private void waitBridge(Activity a) throws Exception {
    long end = System.currentTimeMillis() + 15000;
    while (System.currentTimeMillis() < end) { if ("true".equals(js(a, "!!window.__pftPersistJournal"))) return; Thread.sleep(50); }
    throw new AssertionError("Bridge unavailable");
  }
  @Override public void onCreate(Bundle args) { super.onCreate(args); start(); }
  @Override public void onStart() {
    Bundle output = new Bundle(); JSONObject report = new JSONObject(); int status = Activity.RESULT_OK;
    CountDownLatch release = new CountDownLatch(1);
    try {
      host = Class.forName("org.pocketfieldtrip.review.MainActivity");
      Activity old = startActivitySync(new Intent().setClassName("org.pocketfieldtrip.review", host.getName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
      waitBridge(old);
      WebMessagePort oldPort = (WebMessagePort)get(old, "port");
      ExecutorService oldWorker = (ExecutorService)get(old, "files");
      CountDownLatch entered = new CountDownLatch(1);
      oldWorker.execute(() -> { entered.countDown(); try { release.await(30, TimeUnit.SECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } });
      check(entered.await(10, TimeUnit.SECONDS), "Blocker must enter before queuing old request");
      JSONObject stale = new JSONObject().put("expected", JSONObject.NULL).put("raw", "{\"entries\":[\"stale synthetic journal\"]}");
      Future<String> staleResult = oldWorker.submit(() -> {
        try { call(old, "writeJournal", new Class<?>[]{JSONObject.class, WebMessagePort.class}, stale, oldPort); return "unexpected-save"; }
        catch (InvocationTargetException e) { return String.valueOf(e.getCause()); }
      });
      ActivityMonitor monitor = addMonitor(host.getName(), null, false);
      runOnMainSync(old::recreate);
      Activity fresh = monitor.waitForActivityWithTimeout(15000); removeMonitor(monitor);
      check(fresh != null && fresh != old, "Actual Activity recreation required"); waitBridge(fresh);
      check((Boolean)get(old, "closed"), "Old owner destroyed before clear");
      WebMessagePort freshPort = (WebMessagePort)get(fresh, "port");
      JSONObject clear = new JSONObject().put("expected", JSONObject.NULL).put("raw", JSONObject.NULL);
      call(fresh, "writeJournal", new Class<?>[]{JSONObject.class, WebMessagePort.class}, clear, freshPort);
      check(((JSONObject)call(fresh, "readJournal", new Class<?>[0])).isNull("raw"), "Fresh clear must be stored before releasing old worker");
      check(!staleResult.isDone(), "Old request must still be queued after the fresh clear; blocker timeout invalidates this run");
      release.countDown();
      String rejection = staleResult.get(10, TimeUnit.SECONDS);
      check(rejection.contains("Journal owner expired"), "Old request must fail ownership, despite matching null CAS: " + rejection);
      check(oldWorker.awaitTermination(10, TimeUnit.SECONDS), "Await actual old worker completion, not a settling delay");
      check(((JSONObject)call(fresh, "readJournal", new Class<?>[0])).isNull("raw"), "Old queued request must not resurrect cleared journal");
      boolean conflict = false;
      try { call(fresh, "writeJournal", new Class<?>[]{JSONObject.class, WebMessagePort.class}, new JSONObject().put("expected", "{}").put("raw", "{}"), freshPort); }
      catch (InvocationTargetException e) { conflict = String.valueOf(e.getCause()).contains("Journal changed"); }
      check(conflict, "Current-owner conflicting revision must also reject");
      check(((JSONObject)call(fresh, "readJournal", new Class<?>[0])).isNull("raw"), "Rejected conflict must leave clear intact");
      report.put("passed", true).put("oldRequestRejected", rejection).put("actualRecreation", true).put("freshClearPreserved", true).put("currentOwnerConflictRejected", true).put("oldWorkerTerminated", true);
      report.put("scope", "Production private writer invoked with synthetic requests in actual APK; latch-held executor, actual Activity recreation, fresh clear before stale release, awaited Future and executor termination. No arbitrary persistence delay; UI port receipt tested separately.");
    } catch (Throwable error) {
      status = Activity.RESULT_CANCELED;
      try { StringWriter trace = new StringWriter(); error.printStackTrace(new PrintWriter(trace)); report.put("passed", false).put("error", error.toString()).put("stack", trace.toString()); } catch (Exception ignored) {}
    } finally { release.countDown(); }
    output.putString("report", report.toString()); finish(status, output);
  }
}
