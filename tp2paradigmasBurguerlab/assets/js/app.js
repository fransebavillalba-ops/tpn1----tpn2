
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const money = (n) => n.toLocaleString('es-AR', {style:'currency', currency:'ARS'});

function setupMobileMenu(){
  const btn = $('#btnMenu');
  const nav = $('#mainNav');
  if(!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.hasAttribute('hidden');
    if(open){ nav.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); }
    else { nav.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); }
  });
  document.addEventListener('click', (e) => {
    if(!nav.contains(e.target) && e.target !== btn){ nav.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); }
  });
}

const CART_KEY = 'burgerlab_cart';
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const setCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
const updateCartCount = () => {
  const count = getCart().reduce((acc, it) => acc + it.cantidad, 0);
  const el = $('#cartCount');
  if(el) el.textContent = count;
};
function addToCart(id, cantidad){
  const cart = getCart();
  const idx = cart.findIndex(it => it.id===id);
  if(idx>-1){ cart[idx].cantidad += cantidad; } else { cart.push({id, cantidad}); }
  setCart(cart); updateCartCount(); renderCarrito();
}
function removeFromCart(id){
  const cart = getCart().filter(it => it.id !== id);
  setCart(cart); updateCartCount(); renderCarrito();
}

function setupCartLink(){
  const link = $('#cartLink');
  if(!link) return;
  link.addEventListener('click', (e) => { e.preventDefault(); location.href = 'comprar.html'; });
}

function renderTabla(){
  const tbody = $('#tbodyProductos');
  if(!tbody) return;
  let q = ($('#qTabla')?.value || '').toLowerCase();
  let orden = $('#ordenTabla')?.value || 'nombre';
  let arr = MENU.filter(p => (p.nombre.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  if(orden==='nombre') arr.sort((a,b)=> a.nombre.localeCompare(b.nombre));
  if(orden==='precio_asc') arr.sort((a,b)=> a.precio - b.precio);
  if(orden==='precio_desc') arr.sort((a,b)=> b.precio - a.precio);
  tbody.innerHTML = arr.map(p => `
    <tr>
      <td><img src="${p.img}" alt="${p.nombre}"/></td>
      <td><a href="producto.html?id=${p.id}">${p.nombre}</a></td>
      <td>${p.categoria}</td>
      <td>${money(p.precio)}</td>
      <td><button class="btn" data-add="${p.id}">Agregar</button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('button[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.add), 1));
  });
}

function fillCategorias(){
  const sel = $('#categoriaBox');
  if(!sel) return;
  const cats = Array.from(new Set(MENU.map(p=>p.categoria))).sort();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c; sel.appendChild(opt);
  });
}
function renderCards(){
  const grid = $('#gridProductos');
  if(!grid) return;
  let q = ($('#qBox')?.value || '').toLowerCase();
  let orden = $('#ordenBox')?.value || 'nombre';
  let cat = $('#categoriaBox')?.value || '';
  let arr = MENU.filter(p => 
    (p.nombre.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) &&
    (!cat || p.categoria === cat)
  );
  if(orden==='nombre') arr.sort((a,b)=> a.nombre.localeCompare(b.nombre));
  if(orden==='precio_asc') arr.sort((a,b)=> a.precio - b.precio);
  if(orden==='precio_desc') arr.sort((a,b)=> b.precio - a.precio);
  grid.innerHTML = arr.map(p => `
    <article class="product-card">
      <img src="${p.img}" alt="${p.nombre}" />
      <h3><a href="producto.html?id=${p.id}">${p.nombre}</a></h3>
      <p class="tag">${p.categoria}</p>
      <p>${p.desc}</p>
      <p class="price">${money(p.precio)}</p>
      <button class="btn" data-add="${p.id}">Agregar</button>
    </article>
  `).join('');
  grid.querySelectorAll('button[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.add), 1));
  });
}

function renderProducto(){
  const cont = $('#ficha');
  if(!cont) return;
  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id'), 10);
  const p = MENU.find(x => x.id === id) || MENU[0];
  $('#fotoPrincipal').src = p.img;
  $('#fotoPrincipal').alt = p.nombre;
  $('#nombreProd').textContent = p.nombre;
  $('#categoriaProd').textContent = p.categoria;
  $('#descripcionProd').textContent = p.desc;
  $('#precioProd').textContent = money(p.precio);
  $('#btnAgregar').addEventListener('click', () => {
    const qty = Math.max(1, parseInt($('#cantidad').value || '1',10));
    addToCart(p.id, qty);
  });
  const combos = [
    {txt:'+ Papas clásicas + Gaseosa 354 ml', extra: 2100},
    {txt:'+ Papas cheddar + Gaseosa 500 ml', extra: 2700},
  ];
  $('#combosSugeridos').innerHTML = combos.map(c => `<li>${c.txt}: <strong>${money(c.extra)}</strong></li>`).join('');
}

function renderCarrito(){
  const ul = $('#listaCarrito');
  if(!ul) return;
  const cart = getCart();
  let total = 0;
  ul.innerHTML = cart.map(it => {
    const p = MENU.find(x=>x.id===it.id);
    const subtotal = p.precio * it.cantidad;
    total += subtotal;
    return `<li>
      <span>${p.nombre} × ${it.cantidad}</span>
      <span>${money(subtotal)}</span>
      <button class="btn outline" data-del="${it.id}">Quitar</button>
    </li>`;
  }).join('');
  $('#totalCarrito').textContent = money(total);
  ul.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.del)));
  });
}

function setupForm(){
  const form = $('#formCompra');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['nombre','direccion','telefono','email','pago'];
    const missing = required.filter(k => !data[k]?.trim());
    const msg = $('#msgForm');
    if(missing.length){
      msg.textContent = 'Completá todos los campos requeridos.';
      msg.style.color = '#f87171'; return;
    }
    const emailOk = /.+@.+\..+/.test(data.email);
    if(!emailOk){ msg.textContent = 'Ingresá un e-mail válido.'; msg.style.color = '#f87171'; return; }
    const cart = getCart();
    if(cart.length===0){ msg.textContent = 'Tu pedido está vacío.'; msg.style.color = '#f87171'; return; }
    setCart([]); updateCartCount(); renderCarrito();
    msg.textContent = '¡Pedido confirmado! Te enviamos un correo con el detalle.';
    msg.style.color = '#34d399'; form.reset();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupCartLink();
  updateCartCount();
  if($('#tbodyProductos')){
    $('#qTabla').addEventListener('input', renderTabla);
    $('#ordenTabla').addEventListener('change', renderTabla);
    renderTabla();
  }
  if($('#gridProductos')){
    fillCategorias();
    $('#qBox').addEventListener('input', renderCards);
    $('#ordenBox').addEventListener('change', renderCards);
    $('#categoriaBox').addEventListener('change', renderCards);
    renderCards();
  }
  if($('#ficha')) renderProducto();
  if($('#formCompra')){ renderCarrito(); setupForm(); }
});
