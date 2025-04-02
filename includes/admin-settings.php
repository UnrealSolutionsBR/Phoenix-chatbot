<?php
// Agregar la página de ajustes al menú de administrador
add_action('admin_menu', 'phoenix_add_settings_page');
function phoenix_add_settings_page() {
    add_menu_page(
        'Phoenix Chatbot Settings',
        'Phoenix Chatbot',
        'manage_options',
        'phoenix-chatbot-settings',
        'phoenix_render_settings_page',
        'dashicons-format-chat',
        60
    );
}

// Registrar y guardar la opción
add_action('admin_init', 'phoenix_register_settings');
function phoenix_register_settings() {
    register_setting('phoenix_chatbot_settings_group', 'phoenix_openai_api_key');
}
// Mostrar mensaje de confirmación cuando se actualiza la API Key
add_action('admin_notices', 'phoenix_chatbot_api_key_notice');
function phoenix_chatbot_api_key_notice() {
    if (isset($_GET['settings-updated']) && $_GET['settings-updated']) {
        $api_key = get_option('phoenix_openai_api_key');
        if (!empty($api_key)) {
            echo '<div class="notice notice-success is-dismissible"><p>✅ API Key de OpenAI guardada correctamente.</p></div>';
        } else {
            echo '<div class="notice notice-warning is-dismissible"><p>⚠️ API Key eliminada. El chatbot no podrá responder hasta que se configure una nueva.</p></div>';
        }
    }
}

// Renderizar la página
function phoenix_render_settings_page() {
    ?>
    <div class="wrap">
        <h1>Configuración de Phoenix Chatbot AI</h1>
        <form method="post" action="options.php">
            <?php settings_fields('phoenix_chatbot_settings_group'); ?>
            <?php do_settings_sections('phoenix_chatbot_settings_group'); ?>

            <table class="form-table">
                <tr valign="top">
                    <th scope="row">API Key de OpenAI</th>
                    <td>
                        <input type="password" name="phoenix_openai_api_key" value="<?php echo esc_attr(get_option('phoenix_openai_api_key')); ?>" style="width: 400px;" />
                        <p class="description">Tu clave secreta de OpenAI para habilitar las respuestas del chatbot.</p>
                    </td>
                </tr>
            </table>

            <?php submit_button('Guardar configuración'); ?>
        </form>
    </div>
    <?php
}
