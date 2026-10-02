<?php
// Runs only by docker compose exec inside the disposable QA container.
$_SERVER['HTTP_HOST'] = '127.0.0.1:8766';
$_SERVER['REQUEST_URI'] = '/';
define('WP_INSTALLING', true);
require '/var/www/html/wp-load.php';
require_once '/var/www/html/wp-admin/includes/upgrade.php';
if (!is_blog_installed()) {
    wp_install('Toolkit QA', 'qa-admin', 'qa@example.invalid', false, '', 'local-qa-admin-only-123!');
}
echo 'WordPress QA ready: ' . get_bloginfo('version') . PHP_EOL;
