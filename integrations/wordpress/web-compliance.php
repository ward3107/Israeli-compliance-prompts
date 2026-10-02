<?php
/**
 * Plugin Name: Web Compliance — Cookie Banner
 * Description: A configured cookie banner with a persistent preferences button and a legal-review handoff. Existing tracking plugins require separate integration.
 * Version: 2.5.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * License: MIT
 */
if (!defined('ABSPATH')) { exit; }

add_action('admin_init', function () {
    register_setting('wct_setup', 'wct_banner_enabled', array(
        'type' => 'string', 'default' => '1',
        'sanitize_callback' => function ($value) { return $value === '1' ? '1' : '0'; }
    ));
});

add_action('wp_enqueue_scripts', function () {
    if (get_option('wct_banner_enabled', '1') !== '1') { return; }
    $url = plugin_dir_url(__FILE__);
    $version = '2.5.0';
    wp_enqueue_style('wct-consent', $url . 'cookie-consent.css', array(), $version);
    wp_enqueue_style('wct-theme', $url . 'theme.css', array('wct-consent'), $version);
    wp_enqueue_script('wct-consent', $url . 'cookie-consent.js', array(), $version, true);
    wp_enqueue_script('wct-install', $url . 'install.js', array('wct-consent'), $version, true);
});

add_action('wp_footer', function () {
    if (get_option('wct_banner_enabled', '1') !== '1') { return; }
    echo '<button type="button" id="wct-preferences" class="wct-preferences" aria-label="Cookie preferences">Cookie preferences</button>';
});

add_action('admin_menu', function () {
    add_options_page('Web Compliance', 'Web Compliance', 'manage_options', 'wct-setup', 'wct_settings_page');
});

function wct_settings_page() {
    if (!current_user_can('manage_options')) { return; }
    ?>
    <div class="wrap" dir="rtl">
        <h1>Web Compliance — הגדרות הבאנר</h1>
        <p>התוסף מציג באנר וכפתור לפתיחת ההעדפות מחדש. הוא אינו חוסם אוטומטית כלי מעקב שהותקנו דרך תוספים או קוד אחר.</p>
        <form action="options.php" method="post">
            <?php settings_fields('wct_setup'); ?>
            <input type="hidden" name="wct_banner_enabled" value="0">
            <label><input type="checkbox" name="wct_banner_enabled" value="1" <?php checked(get_option('wct_banner_enabled', '1'), '1'); ?>> הצגת הבאנר באתר</label>
            <?php submit_button('שמירת ההגדרה'); ?>
        </form>
        <h2>מה עוד צריך להשלים?</h2>
        <ol>
            <li>פתחו את האתר בחלון פרטי ובדקו שהבאנר וכפתור ההעדפות מופיעים.</li>
            <li>בדקו שקישור מדיניות הפרטיות מוביל לעמוד הנכון.</li>
            <li>בקשו ממי שמטפל באתר לבדוק חסימת כלי מעקב לפני הסכמה, דחייה ושינוי העדפות. התוסף מספק אירוע compliance:consent לחיבור הכלים.</li>
            <li>העבירו את התיק והאתר לבדיקה משפטית. התקנת התוסף אינה אישור משפטי.</li>
        </ol>
        <p><a class="button button-primary" href="https://ward3107.github.io/web-compliance-prompts/legal-review.html" target="_blank" rel="noopener noreferrer">בדיקה עם עורך דין</a></p>
        <p>אין כרגע עורך דין שותף או מחיר מוסכם. אפשר לפנות לעורך דין לבחירתכם.</p>
        <p><a href="https://ward3107.github.io/web-compliance-prompts/start.html" target="_blank" rel="noopener noreferrer">הכנת חבילה מעודכנת</a></p>
        <p>להסרה: השביתו ומחקו את התוסף במסך התוספים. שום מדיניות או עמוד תוכן אינם נוצרים אוטומטית.</p>
    </div>
    <?php
}
