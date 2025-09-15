document.addEventListener('DOMContentLoaded', () => {
  const fileForm = document.querySelector('#file-submission-form');
  const fileInput = document.querySelector('#file-upload');
  const body = document.querySelector('#documents');
  const feedback = document.querySelector('.upload-feedback');
  const feeds = document.querySelector('.feedback');
  const closeBtn = document.querySelector('.closeUpload');
  if (!fileForm || !fileInput || !body) {
    console.error('Form, file input, or table body not found');
    return;
  }
  fileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.classList.add('active');
    let id = 0;
    const formData = new FormData();
    const files = fileInput.files;
    for (const file of files) {
      const fileName = file.name;
      const fileType = '.' + file.type.split('/')[1];
      id++;
      addTable(id, fileName, fileType);
      formData.append('files', file);
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/v1/upload');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            document.getElementById(
              `progress-${file.name}`
            ).innerText = `${file.name}: ${percent}%`;
            console.log(`${file.name}: ${percent}`);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            document.getElementById(
              `progress-${file.name}`
            ).innerText = `${percent}`;
          } else {
            console.log(`${file.name} upload failed`);
          }
        };
        xhr.send(formData);

        const progressElement = document.createElement('div');
        progressElement.id = `progress-${file.name}`;
        progressElement.innerText = `0%`;
        feeds.appendChild(progressElement);
      } catch (err) {
        console.log(err);
      }
    }
  });

  function formatFileSize(size) {
    if (size < 1024) return size + 'bytes';
    else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + 'KB';
    else return (size / (1024 * 1024)).toFixed(2) + 'MB';
  }

  function addTable(number, name, type) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${number}</td>
      <td>${name}</td>
      <td>${type}</td>
      <td>Uploaded</td>
    `;
    body.appendChild(row);
  }
  closeBtn.addEventListener('click', closeDiv);
  function closeDiv() {
    feedback.classList.remove('active');
  }

  const getFiles = async () => {
    const downloadsContainer = document.querySelector('#download-files');
    try {
      const res = await fetch('/file');
      const data = await res.json();

      downloadsContainer.innerHTML = '';
      data.forEach((file) => {
        const tableRow = document.createElement('tr');
        const tableData = document.createElement('td');
        tableData.textContent = file;
        const link = document.createElement('a');
        link.href = '/download/' + file;
        link.download = file;
        link.textContent = `download`;
        tableRow.append(tableData);
        tableRow.append(link);
        downloadsContainer.appendChild(tableRow);
      });
    } catch (err) {
      console.log(err);
    }
  };

  getFiles();
});
