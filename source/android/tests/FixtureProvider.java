package org.pocketfieldtrip.securitytest;
import android.content.*;
import android.database.*;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.*;
import java.util.concurrent.*;
/** Synthetic external provider. No real documents or Internet permission. */
public final class FixtureProvider extends ContentProvider {
  private static final CountDownLatch releaseWrite=new CountDownLatch(1), releaseRead=new CountDownLatch(1);
  private static volatile boolean writeOpened, readOpened;
  @Override public boolean onCreate(){return true;}
  @Override public String getType(Uri uri){return "application/json";}
  @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){
    if("/release-write".equals(uri.getPath()))releaseWrite.countDown();
    if("/release-read".equals(uri.getPath()))releaseRead.countDown();
    MatrixCursor cursor=new MatrixCursor(new String[]{"_display_name","_size","write_opened","read_opened"});
    cursor.addRow(new Object[]{"synthetic.json",0,writeOpened?1:0,readOpened?1:0});return cursor;
  }
  @Override public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{
    try{
      if(mode.contains("w")){
        ParcelFileDescriptor[] pipe=ParcelFileDescriptor.createPipe();writeOpened=true;
        new Thread(()->{try{releaseWrite.await(20,TimeUnit.SECONDS);try(InputStream in=new ParcelFileDescriptor.AutoCloseInputStream(pipe[0]);OutputStream out=new FileOutputStream(new File(getContext().getCacheDir(),"written.json"))){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}}catch(Exception ignored){}},"fixture-write").start();
        return pipe[1];
      }
      if("/slow-write".equals(uri.getPath()))return ParcelFileDescriptor.open(new File(getContext().getCacheDir(),"written.json"),ParcelFileDescriptor.MODE_READ_ONLY);
      ParcelFileDescriptor[] pipe=ParcelFileDescriptor.createPipe();
      new Thread(()->{try(OutputStream out=new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1])){
        if("/slow-read".equals(uri.getPath())){readOpened=true;releaseRead.await(20,TimeUnit.SECONDS);}
        if("/oversize".equals(uri.getPath())){byte[] b=new byte[8192];for(int i=0;i<256;i++)out.write(b);out.write(1);}else out.write("{}".getBytes("UTF-8"));
      }catch(Exception ignored){}},"fixture-read").start();return pipe[0];
    }catch(IOException e){throw new FileNotFoundException(e.toString());}
  }
  @Override public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException();}
  @Override public int delete(Uri uri,String selection,String[] args){return 0;}
  @Override public int update(Uri uri,ContentValues values,String selection,String[] args){return 0;}
}
