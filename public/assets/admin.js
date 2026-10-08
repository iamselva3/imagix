const $=s=>document.querySelector(s);
const categories=['Wedding','Pre-Wedding','Maternity','Baby & Kids','Events','Portrait','Product'];
let token=sessionStorage.getItem('imagix-admin-token')||'';
const authHeaders=()=>({'authorization':`Bearer ${token}`});

async function api(path,options={}){
  const response=await fetch(path,{...options,headers:{...authHeaders(),...(options.headers||{})}});
  const result=await response.json().catch(()=>({}));
  if(response.status===401){logout();throw new Error('Your session expired. Please sign in again.');}
  if(!response.ok)throw new Error(result.error||'The request could not be completed.');
  return result;
}
function showDashboard(){const authed=Boolean(token);$('#login-panel').hidden=authed;$('#dashboard').hidden=!authed;if(authed)loadPhotos();}
function logout(){token='';sessionStorage.removeItem('imagix-admin-token');showDashboard();}
$('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();const status=$('#login-status');status.textContent='Signing in…';
  try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:new FormData(event.currentTarget).get('password')})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Sign in failed.');token=data.token;sessionStorage.setItem('imagix-admin-token',token);showDashboard();}
  catch(error){status.textContent=error.message;}
});
$('#logout').addEventListener('click',logout);$('#refresh').addEventListener('click',loadPhotos);

async function loadPhotos(){
  const list=$('#photo-list');list.innerHTML='<p class="empty">Loading the gallery…</p>';
  try{const data=await api('/api/photos');const photos=data.photos||[];$('#photo-count').textContent=photos.length;list.replaceChildren();if(!photos.length){list.innerHTML='<p class="empty">No photographs yet. Upload a few to get started.</p>';return;}photos.sort((a,b)=>(a.order??0)-(b.order??0)).forEach(photo=>list.append(renderPhoto(photo)));}
  catch(error){list.innerHTML=`<p class="empty">${escapeHtml(error.message)}</p>`;}
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function renderPhoto(photo){
  const row=document.createElement('article');row.className='photo-row';
  const image=document.createElement('img');image.src=photo.thumbnailUrl||`/media/${photo.id}?size=thumb`;image.alt=photo.alt||photo.title||'Gallery image';
  const meta=document.createElement('div');meta.className='photo-meta';
  const title=document.createElement('input');title.value=photo.title||'';title.placeholder='Image title';title.maxLength=100;title.setAttribute('aria-label','Image title');
  const category=document.createElement('select');category.setAttribute('aria-label','Image category');categories.forEach(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;option.selected=photo.category===name;category.append(option);});
  const actions=document.createElement('div');actions.className='photo-actions';
  const up=document.createElement('button');up.textContent='↑';up.title='Move earlier';up.setAttribute('aria-label','Move earlier');up.addEventListener('click',()=>updatePhoto(photo,{order:Math.max(0,(photo.order||0)-1)}));
  const down=document.createElement('button');down.textContent='↓';down.title='Move later';down.setAttribute('aria-label','Move later');down.addEventListener('click',()=>updatePhoto(photo,{order:(photo.order||0)+1}));
  const cover=document.createElement('button');cover.textContent=photo.isCover?'Cover ★':'Set cover ☆';cover.classList.toggle('covered',Boolean(photo.isCover));cover.addEventListener('click',()=>updatePhoto(photo,{isCover:!photo.isCover}));
  const save=document.createElement('button');save.textContent='Save';save.addEventListener('click',()=>updatePhoto(photo,{title:title.value,category:category.value}));
  const remove=document.createElement('button');remove.textContent='Delete';remove.className='delete';remove.addEventListener('click',async()=>{if(!confirm(`Delete “${photo.title||photo.category}” from the gallery?`))return;try{await api(`/api/photos/${encodeURIComponent(photo.id)}`,{method:'DELETE'});loadPhotos();}catch(error){alert(error.message);}});
  meta.append(title,category);actions.append(up,down,cover,save,remove);row.append(image,meta,actions);return row;
}
async function updatePhoto(photo,changes){try{await api(`/api/photos/${encodeURIComponent(photo.id)}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(changes)});loadPhotos();}catch(error){alert(error.message);}}

function resizeWebp(file,maxEdge,quality){return new Promise((resolve,reject)=>{
  const source=URL.createObjectURL(file),image=new Image();image.onload=()=>{const scale=Math.min(1,maxEdge/Math.max(image.naturalWidth,image.naturalHeight));const width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d',{alpha:false}).drawImage(image,0,0,width,height);canvas.toBlob(blob=>{URL.revokeObjectURL(source);if(blob)resolve({blob,width,height});else reject(new Error('This browser could not convert an image to WebP.'));},'image/webp',quality);};image.onerror=()=>{URL.revokeObjectURL(source);reject(new Error(`Could not read ${file.name}.`));};image.src=source;
});}
async function uploadFiles(files){
  const status=$('#upload-status'),progress=$('#upload-progress'),bar=$('i',progress);if(!files.length)return;
  progress.hidden=false;let completed=0;bar.style.width='0%';
  for(const file of files){
    try{
      if(!file.type.startsWith('image/'))throw new Error(`${file.name} is not an image.`);
      status.textContent=`Preparing ${file.name}…`;
      const main=await resizeWebp(file,2400,.84),thumb=await resizeWebp(file,480,.72);
      const form=new FormData();form.append('image',main.blob,`${file.name}.webp`);form.append('thumbnail',thumb.blob,`${file.name}-thumb.webp`);form.append('category',$('#default-category')?.value||'Wedding');form.append('title',file.name.replace(/\.[^.]+$/u,'').slice(0,100));form.append('alt',file.name.replace(/\.[^.]+$/u,'').slice(0,180));form.append('width',String(main.width));form.append('height',String(main.height));
      await api('/api/photos',{method:'POST',body:form});completed++;bar.style.width=`${completed/files.length*100}%`;
    }catch(error){status.textContent=error.message;}
  }
  if(completed)status.textContent=`Added ${completed} photograph${completed===1?'':'s'}.`;
  progress.hidden=true;loadPhotos();
}
const input=$('#file-input');input.addEventListener('change',()=>{uploadFiles([...input.files]);input.value='';});
const zone=$('#drop-zone');['dragenter','dragover'].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.add('dragging');}));['dragleave','drop'].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.remove('dragging');}));zone.addEventListener('drop',event=>uploadFiles([...event.dataTransfer.files]));
const categorySelect=document.createElement('select');categorySelect.id='default-category';categorySelect.setAttribute('aria-label','Default upload category');categorySelect.style.cssText='margin:8px;background:#0c0c0d;color:#f2eee7;border:1px solid #383736;padding:10px';categories.forEach(name=>categorySelect.add(new Option(name,name)));$('.choose-files').before(categorySelect);
showDashboard();
