package com.elta.entregas

import android.os.Bundle
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 60, 40, 40)
        }

        val title = TextView(this).apply {
            text = "Registro de Entregas"
            textSize = 26f
        }

        val version = TextView(this).apply {
            text = "Versión 1.0"
            textSize = 14f
        }

        val btnEntrega = Button(this).apply {
            text = "Confirmar Entrega"
        }

        val btnUsuario = Button(this).apply {
            text = "Usuario"
        }

        val btnUltimo = Button(this).apply {
            text = "Último Registro"
        }

        layout.addView(title)
        layout.addView(version)
        layout.addView(btnEntrega)
        layout.addView(btnUsuario)
        layout.addView(btnUltimo)

        setContentView(layout)
    }
}
