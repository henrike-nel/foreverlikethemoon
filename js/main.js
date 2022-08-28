// ---------------------------------------------------------------------------------------------------------------------------->
// SCROLL FUNCTIONS   ||-----------
// ---------------------------------------------------------------------------------------------------------------------------->
function init_scroll() {

    $('.scroll-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 2000);
        return false;
    });

    $('.scroll-down[href^="#"], .scroll-to-target[href^="#"]').on('click', function (e) {
        e.preventDefault();

        var target = this.hash;
        var $target = $(target);

        $('html, body').stop().animate({
            'scrollTop': $target.offset().top
        }, 900, 'swing', function () {
            window.location.hash = target;
        });
    });

};
