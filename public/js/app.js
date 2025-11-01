$(document).ready(function() {
  // Initialize all Materialize modals
  $('.modal').modal();

  // Handle saving notes when "Post Comment" button is clicked
  $(document).on("click", ".save-note", function(event) {
    event.preventDefault();

    const articleId = $(this).attr("data-id");
    const headerValue = $("#note-header-" + articleId).val().trim();
    const textValue = $("#note-text-" + articleId).val().trim();

    // Validate input
    if (!headerValue || !textValue) {
      alert("Please fill in both the title and comment fields.");
      return;
    }

    // Send POST request to save the note
    $.ajax({
      method: "POST",
      url: "/articles/" + articleId,
      data: {
        header: headerValue,
        text: textValue
      }
    })
    .done(function(response) {
      console.log("Note saved successfully:", response);
      alert("Comment posted successfully!");

      // Clear the form fields
      $("#note-header-" + articleId).val("");
      $("#note-text-" + articleId).val("");

      // Close the modal
      const modalInstance = M.Modal.getInstance($("#modal-" + articleId)[0]);
      modalInstance.close();
    })
    .fail(function(error) {
      console.error("Error saving note:", error);
      alert("Error posting comment. Please try again.");
    });
  });

  // Optional: View existing notes
  $(document).on("click", ".card", function(event) {
    // Only trigger if clicking on the card itself, not links
    if ($(event.target).is("a") || $(event.target).closest("a").length > 0) {
      return;
    }

    const articleId = $(this).attr("data-id");

    // Fetch article with note
    $.ajax({
      method: "GET",
      url: "/articles/" + articleId
    })
    .done(function(article) {
      if (article.note) {
        console.log("Article has note:", article.note);
        // You could display the existing note here if desired
      }
    })
    .fail(function(error) {
      console.error("Error fetching article:", error);
    });
  });
});
