package com.elta.entregas;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(40, 70, 40, 40);
        layout.setGravity(Gravity.CENTER_HORIZONTAL);

        TextView logo = new TextView(this);
        logo.setText("ELTA");
        logo.setTextSize(34);
        logo.setTextColor(Color.rgb(46, 125, 50));
        logo.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText("Registro de Entregas");
        title.setTextSize(26);
        title.setGravity(Gravity.CENTER);

        TextView version = new TextView(this);
        version.setText("Versión 1.0");
        version.setTextSize(14);
        version.setGravity(Gravity.CENTER);

        Button confirmar = new Button(this);
        confirmar.setText("Confirmar Entrega");

        Button usuario = new Button(this);
        usuario.setText("Usuario");

        Button ultimo = new Button(this);
        ultimo.setText("Último Registro");

        layout.addView(logo);
        layout.addView(title);
        layout.addView(version);
        layout.addView(confirmar);
        layout.addView(usuario);
        layout.addView(ultimo);

        setContentView(layout);
    }
}
