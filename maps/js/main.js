$(".show").on("click", function () {
    $(".md_overlay, .pop_up").addClass( "active" );
});
$(".md_close").on("click", function () {
    $(".md_overlay, .pop_up").removeClass( "active" );
});
$("#submit").on("click", function () {
    $(".md_overlay, .pop_up").removeClass( "active" );
});
$(".form_pop_up table tbody tr").on("click", function () {
    $(".md_overlay, .pop_up").removeClass( "active" );
});