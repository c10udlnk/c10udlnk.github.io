document.addEventListener('DOMContentLoaded', function () {
  const runLightbox = () => {
    btf.loadLightbox(document.querySelectorAll('#article-container img:not(.no-lightbox)'))
  }
}