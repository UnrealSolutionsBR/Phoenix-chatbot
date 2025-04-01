<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot AI con múltiples asistentes, saludo dinámico y UI personalizada.
 * Version: 1.0
 * Author: Unreal Solutions
 * Plugin URI: https://unrealsolutions.com.br/
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Definir la URL base del plugin
define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );

// Cargar fuente Open Sans desde Google Fonts
add_action('wp_head', function () {
    echo "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap' rel='stylesheet'>";
});

// Cargar estilos y scripts con control de versión por caché
add_action( 'wp_enqueue_scripts', 'phoenix_enqueue_chatbot_assets' );
function phoenix_enqueue_chatbot_assets() {
    $js_version  = filemtime( plugin_dir_path( __FILE__ ) . 'assets/js/chatbot.js' );
    $css_version = filemtime( plugin_dir_path( __FILE__ ) . 'assets/css/chatbot.css' );

    wp_enqueue_style( 'phoenix-chatbot-style', PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css', [], $css_version );
    wp_enqueue_script( 'phoenix-chatbot-script', PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js', [], $js_version, true );

    // Pasar la URL base al script JS
    wp_localize_script( 'phoenix-chatbot-script', 'phoenixChatbotBaseUrlData', [
        'baseUrl' => PHOENIX_CHATBOT_URL
    ]);
}

// Shortcode para mostrar el chatbot
add_shortcode( 'Phoenix_chatbot', 'phoenix_render_chatbot' );
function phoenix_render_chatbot() {
    ob_start(); ?>
    
    <!-- Loader con spinner -->
    <div class="phoenix-loader" id="phoenix-loader">
        <div class="phoenix-spinner"></div>
    </div>

    <!-- Contenedor del chatbot -->
    <div class="phoenix-chatbot-container" style="display:none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages"></div>
        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe tu mensaje..." />
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>

    <?php return ob_get_clean();
}
