function toggleMenu(menuElement) {
    menuElement.classList.toggle("change");

    // Toggle dropdown menu visibility
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu.style.display === "none") {
      dropdownMenu.style.display = "block";
    } else {
      dropdownMenu.style.display = "none";
    }
  }