const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const categoryImages = {
  'Wedding': [
    ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=78','Wedding day'],
    ['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=78','A happy celebration'],
    ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=78','Just married'],
  ],
  'Pre-Wedding': [
    ['https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=78','A walk together'],
    ['https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=78','A little laughter'],
  ],
  'Maternity': [['https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=78','Growing family'],['https://images.unsplash.com/photo-1530041539828-114de669390e?auto=format&fit=crop&w=900&q=78','A new chapter']],
  'Baby & Kids': [['https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=78','Little wonder'],['https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=900&q=78','Family day']],
  'Events': [['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=78','A good gathering'],['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=78','The celebration']],
  'Portrait': [['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=78','In the afternoon light'],['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=78','A portrait, unscripted']],
  'Product': [['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=78','Made with care'],['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=78','Small details']],
};
let allPhotos = Object.entries(categoryImages).flatMap(([category, images]) => images.map(([url, title], index) => ({id:`sample-${category}-${index}`,category,title,url,thumbnailUrl:url, sample:true})));
let activeFilter = 'All';
let visiblePhotos = [];
let lightboxIndex = 0;
let zoom = 1;
let startPoints = new Map();
let pointerOrigins = new Map();

function makeCard(photo) {
  const figure = document.createElement('figure');
  figure.className = 'gallery-item';
  figure.dataset.category = photo.category || 'Wedding';
  figure.dataset.photoId = photo.id;
  figure.tabIndex = 0;
  figure.setAttribute('role','button');
  figure.setAttribute('aria-label',`View ${photo.title || photo.category || 'photograph'}`);
  const image = document.createElement('img');
  image.src = photo.thumbnailUrl || photo.url || `/media/${encodeURIComponent(photo.id)}?size=thumb`;
  image.alt = photo.alt || photo.title || `${photo.category} photography by Imagix`;
  image.loading = 'lazy'; image.width = 900; image.height = 1100;
  const caption = document.createElement('figcaption');
  caption.textContent = photo.title || photo.category || 'A story worth keeping';
  figure.append(image, caption);
  figure.addEventListener('click', () => openLightbox(photo));
  figure.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLightbox(photo); } });
  return figure;
}

function renderGallery() {
  const grid = $('#gallery-grid');
  if (!grid) return;
  visiblePhotos = allPhotos.filter(photo => activeFilter === 'All' || photo.category === activeFilter);
  grid.replaceChildren(...visiblePhotos.map(makeCard));
  $('#gallery-note').textContent = allPhotos.some(photo => !photo.sample)
    ? `${visiblePhotos.length} frame${visiblePhotos.length === 1 ? '' : 's'} from stories we’ve told.`
    : 'A few favourites while the stories find their way here.';
  if (window.gsap && !reduceMotion) gsap.fromTo($$('.gallery-item',grid), {opacity:0,y:16}, {opacity:1,y:0,duration:.55,stagger:.045,ease:'power2.out'});
}

async function loadPhotos() {
  try {
    const response = await fetch('/api/photos');
    if (!response.ok) return;
    const data = await response.json();
    const photos = data.photos || [];
    if (photos.length) {
      allPhotos = photos.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(photo => ({...photo, url:photo.url || `/media/${encodeURIComponent(photo.id)}`, thumbnailUrl:photo.thumbnailUrl || `/media/${encodeURIComponent(photo.id)}?size=thumb`}));
      $$('.stack-card').forEach(card => {
        const categoryPhotos = allPhotos.filter(photo => photo.category === card.dataset.category);
        const cover = categoryPhotos.find(photo => photo.isCover) || categoryPhotos[0];
        if (!cover) return;
        const mainImage = $('.card-image-main img', card);
        mainImage.src = cover.url;
        mainImage.alt = cover.alt || cover.title || `${cover.category} photography by Imagix`;
        const detail = categoryPhotos.find(photo => photo.id !== cover.id);
        if (detail) {
          const detailImage = $('.card-image-small img', card);
          detailImage.src = detail.thumbnailUrl;
          detailImage.alt = detail.alt || detail.title || `${detail.category} photography detail`;
        }
      });
      renderGallery();
    }
  } catch { /* The editorial sample gallery stays available when the API is offline. */ }
}

function setFilter(category) {
  activeFilter = category;
  $$('.filter').forEach(button => button.classList.toggle('active', button.dataset.filter === category));
  renderGallery();
}

function openLightbox(photo) {
  const index = visiblePhotos.findIndex(item => item.id === photo.id);
  lightboxIndex = Math.max(0,index);
  setLightboxPhoto();
  const dialog = $('#lightbox');
  if (!dialog.open) dialog.showModal();
}
function setLightboxPhoto() {
  const photo = visiblePhotos[lightboxIndex];
  if (!photo) return;
  zoom = 1;
  const image = $('figure img', $('#lightbox'));
  image.src = photo.url || `/media/${encodeURIComponent(photo.id)}`;
  image.alt = photo.alt || photo.title || photo.category || 'Imagix photograph';
  image.style.transform = 'scale(1)';
  $('figcaption', $('#lightbox')).textContent = `${photo.title || photo.category || 'Imagix Photography'} · ${String(lightboxIndex + 1).padStart(2,'0')} / ${String(visiblePhotos.length).padStart(2,'0')}`;
}
function stepLightbox(direction) {
  if (!visiblePhotos.length) return;
  lightboxIndex = (lightboxIndex + direction + visiblePhotos.length) % visiblePhotos.length;
  setLightboxPhoto();
}

function initSplash() {
  const splash = $('#splash');
  if (!splash) return;
  const done = () => { splash.classList.add('done'); document.body.classList.remove('locked'); };
  if (reduceMotion || sessionStorage.getItem('imagix-splash-seen')) { done(); return; }
  document.body.classList.add('locked');
  const count = $('#splash-count'), bar = $('#splash-progress');
  if (window.gsap) {
    gsap.to({value:0},{value:100,duration:1.85,ease:'power1.inOut',onUpdate(){const v=Math.round(this.targets()[0].value);count.textContent=String(v).padStart(3,'0');bar.style.width=`${v}%`;},onComplete(){sessionStorage.setItem('imagix-splash-seen','1');setTimeout(done,180);}});
  } else setTimeout(()=>{sessionStorage.setItem('imagix-splash-seen','1');done();},2100);
}

function initMotion() {
  const gsapLib = window.gsap, ST = window.ScrollTrigger;
  const stack = $('#stack-stage');
  if (!gsapLib || !ST || reduceMotion) { stack?.classList.add('stack-static'); return; }
  gsapLib.registerPlugin(ST);
  gsapLib.from('.hero-content .eyebrow',{y:20,opacity:0,duration:.8,delay:.25});
  gsapLib.from('.title-line > *',{yPercent:110,opacity:0,duration:1,stagger:.14,delay:.28,ease:'power3.out'});
  gsapLib.from('.hero-bottom',{y:20,opacity:0,duration:.8,delay:.8});
  gsapLib.utils.toArray('[data-parallax]').forEach(element => gsapLib.to(element,{yPercent:-8*Number(element.dataset.parallax)*10,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}}));
  gsapLib.utils.toArray('.intro,.gallery-head,.process-heading,.packages-head,.contact-copy,.visit>div').forEach(element=>gsapLib.from(element,{y:35,opacity:0,duration:.8,scrollTrigger:{trigger:element,start:'top 86%',once:true}}));
  gsapLib.utils.toArray('.card-image img,.quote-image img').forEach(image=>gsapLib.fromTo(image,{scale:1.12},{scale:1,ease:'none',scrollTrigger:{trigger:image.closest('section')||image,start:'top bottom',end:'bottom top',scrub:true}}));
  const cards = $$('.stack-card'), stage = $('#stack-stage');
  if (cards.length && stage) {
    cards.forEach((card,index)=>{gsapLib.set(card,{xPercent:index===0?0:100,scale:1,autoAlpha:index===0?1:0});});
    const timeline = gsapLib.timeline({scrollTrigger:{trigger:stage,start:'top top',end:()=>`+=${cards.length*window.innerHeight}`,pin:true,scrub:1,invalidateOnRefresh:true}});
    cards.slice(1).forEach((card,index)=>{
      const previous=cards[index];
      timeline.to(card,{xPercent:0,autoAlpha:1,duration:1,ease:'none'},index);
      timeline.to(previous,{xPercent:-8,scale:.92,autoAlpha:.42,duration:1,ease:'none'},index);
    });
    timeline.eventCallback('onUpdate',()=>{
      const progress=timeline.progress();
      const active=Math.min(cards.length-1,Math.floor(progress*(cards.length-1)+.0001));
      $('#stack-current').textContent=String(active+1).padStart(2,'0');
      $('#stack-progress').style.width=`${100*(active+1)/cards.length}%`;
      cards.forEach((card,index)=>card.classList.toggle('active',index===active));
    });
  }
  gsapLib.utils.toArray('[data-count]').forEach(el=>{
    const target=Number(el.dataset.count);
    gsapLib.to({count:0},{count:target,duration:1.6,ease:'power1.out',scrollTrigger:{trigger:el,start:'top 88%',once:true},onUpdate(){el.textContent=`${Math.round(this.targets()[0].count)}+`;}});
  });
  gsapLib.fromTo('.process-line i',{height:0},{height:'100%',ease:'none',scrollTrigger:{trigger:'.process-list',start:'top 70%',end:'bottom 70%',scrub:true}});
}

function initHeader() {
  const header=$('.site-header');
  const update=()=>header.classList.toggle('scrolled',scrollY>35);
  addEventListener('scroll',update,{passive:true});update();
  const overlay=$('#menu-overlay'),toggle=$('#menu-toggle');
  const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false');document.body.classList.remove('locked');};
  toggle.addEventListener('click',()=>{overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');document.body.classList.add('locked');});
  $('#menu-close').addEventListener('click',close);
  $$('nav a',overlay).forEach(link=>link.addEventListener('click',close));
}

function initContact() {
  const form=$('#contact-form');
  $('#form-started').value=String(Date.now());
  fetch('/api/config').then(r=>r.ok?r.json():null).then(config=>{
    if(config?.whatsappNumber){const digits=String(config.whatsappNumber).replace(/\D/g,'');if(digits)$('#whatsapp-link').href=`https://wa.me/${digits}`;}
  }).catch(()=>{});
  form.addEventListener('submit',async event=>{
    event.preventDefault();const status=$('#form-status'),button=$('.submit-button',form);button.disabled=true;status.textContent='Sending your note…';
    const data=Object.fromEntries(new FormData(form));data.startedAt=Number(data.startedAt);
    try{const response=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not send your note.');status.textContent='Thanks for writing. We’ll be in touch soon.';form.reset();$('#form-started').value=String(Date.now());}
    catch(error){status.textContent=error.message==='Failed to fetch'?'We couldn’t reach the studio just now. Please try again in a moment.':error.message;}
    finally{button.disabled=false;}
  });
}

function initTestimonials() {
  const quotes=[['They made the whole day feel easy. When we saw the photos, we could hear the laughter all over again.','PRIYA & ARUN','COIMBATORE'],['Every picture feels like us. The little moments are somehow our favourites.','MEERA & KARTHIK','CHENNAI'],['We felt so comfortable, and the photos brought the day right back.','ANJALI & VIKRAM','OOTY']];let index=0;
  const draw=()=>{const [quote,names,place]=quotes[index];$('blockquote',$('.quote-content')).textContent=quote;$('.quote-content>p').innerHTML=`${names} <i>·</i> ${place}`;$('.quote-controls span').innerHTML=`${String(index+1).padStart(2,'0')} <i>/</i> 03`;};
  $('#quote-prev').addEventListener('click',()=>{index=(index+2)%3;draw();});$('#quote-next').addEventListener('click',()=>{index=(index+1)%3;draw();});
}

function initLightbox() {
  const dialog=$('#lightbox'),image=$('figure img',dialog);
  $('.lightbox-close',dialog).addEventListener('click',()=>dialog.close());
  $('.lightbox-prev',dialog).addEventListener('click',()=>stepLightbox(-1));$('.lightbox-next',dialog).addEventListener('click',()=>stepLightbox(1));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')stepLightbox(-1);if(event.key==='ArrowRight')stepLightbox(1);});
  image.addEventListener('wheel',event=>{event.preventDefault();zoom=Math.min(3,Math.max(1,zoom+(event.deltaY<0?.15:-.15)));image.style.transform=`scale(${zoom})`;},{passive:false});
  image.addEventListener('pointerdown',event=>{image.setPointerCapture(event.pointerId);const point={x:event.clientX,y:event.clientY};startPoints.set(event.pointerId,point);pointerOrigins.set(event.pointerId,point);});
  image.addEventListener('pointermove',event=>{if(!startPoints.has(event.pointerId))return;startPoints.set(event.pointerId,{x:event.clientX,y:event.clientY});if(startPoints.size>=2){const points=[...startPoints.values()];const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);zoom=Math.min(3,Math.max(1,distance/180));image.style.transform=`scale(${zoom})`;}});
  ['pointerup','pointercancel'].forEach(name=>image.addEventListener(name,event=>{const origin=pointerOrigins.get(event.pointerId);if(name==='pointerup'&&startPoints.size===1&&zoom===1&&origin){const delta=event.clientX-origin.x;if(Math.abs(delta)>55)stepLightbox(delta<0?1:-1);}startPoints.delete(event.pointerId);pointerOrigins.delete(event.pointerId);}));
}

function initCursor() {
  const cursor=$('#cursor-dot');
  const hero=$('.hero');
  if (matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove',event=>{
      const rect=hero.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5, y=(event.clientY-rect.top)/rect.height-.5;
      $$('.hero-glow').forEach((orb,index)=>{orb.style.transform=`translate3d(${x*(index?28:42)}px,${y*(index?22:34)}px,0)`;});
    },{passive:true});
    $$('.round-link,.header-cta,.submit-button').forEach(button=>{
      button.addEventListener('pointermove',event=>{const rect=button.getBoundingClientRect();button.style.transform=`translate3d(${(event.clientX-rect.left-rect.width/2)*.13}px,${(event.clientY-rect.top-rect.height/2)*.18}px,0)`;});
      button.addEventListener('pointerleave',()=>{button.style.transform='';});
    });
  }
  if(matchMedia('(pointer:fine)').matches&&!reduceMotion){cursor.style.display='grid';addEventListener('pointermove',event=>{cursor.style.left=`${event.clientX}px`;cursor.style.top=`${event.clientY}px`;},{passive:true});
    document.addEventListener('pointerover',event=>{if(event.target.closest('.gallery-item,.card-image'))cursor.classList.add('view');});document.addEventListener('pointerout',event=>{if(event.target.closest('.gallery-item,.card-image'))cursor.classList.remove('view');});}
}

$('#year').textContent=String(new Date().getFullYear());
$('#filters').addEventListener('click',event=>{const button=event.target.closest('.filter');if(button)setFilter(button.dataset.filter);});
$$('.category-link').forEach(link=>link.addEventListener('click',()=>setFilter(link.dataset.filter)));
initSplash();initHeader();initContact();initTestimonials();initLightbox();initCursor();renderGallery();loadPhotos();
if(window.Lenis&&!reduceMotion){const lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:{offset:-70}});const tick=time=>{lenis.raf(time);requestAnimationFrame(tick);};requestAnimationFrame(tick);if(window.ScrollTrigger)lenis.on('scroll',ScrollTrigger.update);}
initMotion();
