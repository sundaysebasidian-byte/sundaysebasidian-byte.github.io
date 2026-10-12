package org.pocketfieldtrip.securitytest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
public final class GrantActivity extends Activity {
  @Override public void onCreate(Bundle saved) {
    super.onCreate(saved);
    grantUriPermission("org.pocketfieldtrip.review", Uri.parse("content://org.pocketfieldtrip.securitytest.documents/"), Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
    finish();
  }
}
