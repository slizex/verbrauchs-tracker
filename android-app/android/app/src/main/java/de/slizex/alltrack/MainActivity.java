package de.slizex.alltrack;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AllTrackPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
