/**
 * A.R.I.A — Client-side interactions
 * Handles: run-digest button, feed toggles, flash auto-dismiss
 */

document.addEventListener('DOMContentLoaded', function () {
    initRunDigestButton();
    initFlashAutoDismiss();
});


/**
 * Attach loading state to the "Run digest now" button on click.
 * Disables the button, shows a spinner, and updates the text.
 */
function initRunDigestButton() {
    var btn = document.getElementById('btn-run-digest');
    if (!btn) return;

    var form = document.getElementById('run-digest-form');
    if (!form) return;

    form.addEventListener('submit', function () {
        var textEl = btn.querySelector('.btn-run-text');
        var iconEl = btn.querySelector('.btn-run-icon');
        var spinnerEl = document.getElementById('run-spinner');

        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'wait';

        if (textEl) textEl.textContent = 'RUNNING... THIS MAY TAKE A MINUTE';
        if (iconEl) iconEl.style.display = 'none';
        if (spinnerEl) spinnerEl.style.display = 'inline-block';
    });
}


/**
 * Auto-dismiss flash messages after 4 seconds with a fade-out animation.
 */
function initFlashAutoDismiss() {
    var flashes = document.querySelectorAll('.flash');
    if (!flashes.length) return;

    flashes.forEach(function (flash) {
        setTimeout(function () {
            flash.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            flash.style.opacity = '0';
            flash.style.transform = 'translateY(-8px)';
            setTimeout(function () {
                if (flash.parentElement) {
                    flash.remove();
                }
            }, 400);
        }, 4000);
    });
}
