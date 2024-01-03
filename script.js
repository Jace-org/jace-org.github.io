  function toggleTheme() {
  const btn = document.getElementById('btn');
  const body = document.body;

  if (body.style.backgroundColor === 'black') {
    body.style.backgroundColor = 'white';
    body.style.color = 'black';
    btn.innerText = 'Dark-Theme';
  } else {
    body.style.backgroundColor = 'black';
    body.style.color = 'white';
    btn.innerText = 'Light-Theme';
  }
}

document.getElementById('btn').addEventListener('click', toggleTheme);
