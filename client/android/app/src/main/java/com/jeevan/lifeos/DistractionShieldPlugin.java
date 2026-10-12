package com.jeevan.lifeos;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "DistractionShield")
public class DistractionShieldPlugin extends Plugin {

    private boolean isShieldActive = false;
    private String activeSessionId = null;
    private final List<String> blockedPackages = new ArrayList<>();

    @PluginMethod
    public void getCapabilities(PluginCall call) {
        Context context = getContext();
        boolean usageGranted = hasUsageAccessPermission(context);
        boolean overlayGranted = hasOverlayPermission(context);

        JSObject ret = new JSObject();
        ret.put("platform", "android");
        ret.put("canDetectForegroundApp", usageGranted);
        ret.put("canDisplayWarningOverlay", overlayGranted);
        ret.put("canEnforceAppRestriction", false); // Standard Android cannot kill other apps without MDM
        ret.put("canMaintainBackgroundEnforcement", false); // Subject to OS battery optimizations
        ret.put("canRecoverAfterInterruption", true);
        ret.put("usageAccessGranted", usageGranted);
        ret.put("overlayPermissionGranted", overlayGranted);
        ret.put("isShieldActive", isShieldActive);
        ret.put("activeSessionId", activeSessionId);
        ret.put("status", (usageGranted && overlayGranted) ? "authorized" : "permission_required");
        call.resolve(ret);
    }

    @PluginMethod
    public void requestUsageAccess(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } else {
            call.reject("Usage stats not supported on this Android version");
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void startShield(PluginCall call) {
        String sessionId = call.getString("sessionId");
        JSArray packages = call.getArray("blockedPackages");

        isShieldActive = true;
        activeSessionId = sessionId;
        blockedPackages.clear();

        if (packages != null) {
            try {
                for (int i = 0; i < packages.length(); i++) {
                    blockedPackages.add(packages.getString(i));
                }
            } catch (Exception ignored) {}
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("isShieldActive", true);
        ret.put("sessionId", sessionId);
        ret.put("blockedCount", blockedPackages.size());
        call.resolve(ret);
    }

    @PluginMethod
    public void stopShield(PluginCall call) {
        isShieldActive = false;
        activeSessionId = null;
        blockedPackages.clear();

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("isShieldActive", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void getShieldStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isShieldActive", isShieldActive);
        ret.put("activeSessionId", activeSessionId);
        ret.put("blockedCount", blockedPackages.size());
        call.resolve(ret);
    }

    private boolean hasUsageAccessPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps == null) return false;
            int mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    context.getPackageName()
            );
            return mode == AppOpsManager.MODE_ALLOWED;
        }
        return false;
    }

    private boolean hasOverlayPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }
}
