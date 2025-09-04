// script.js (site de usuários)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA59M0bP6M_IMCWeWFscXwb5wJHRvlBqD8",
  authDomain: "visitas-9111e.firebaseapp.com",
  projectId: "visitas-9111e",
  storageBucket: "visitas-9111e.firebasestorage.app",
  messagingSenderId: "735353865446",
  appId: "1:735353865446:web:a7511948ce611250266727"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const visitaForm = document.getElementById('visitaForm');
const visitasContainer = document.getElementById('visitasContainer');
const searchInput = document.getElementById('searchInput');
const bairroButtons = document.querySelectorAll('.bairro-btn');
const ordenarBtn = document.getElementById('ordenarBtn');
const ordenarMenu = document.getElementById('ordenarMenu');

let currentFilter = '';
let currentSort = 'agendadas-recentes';
let searchQuery = '';

// Scroll util
window.scrollToSection = id => document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
function scrollToSection(id){ window.scrollToSection(id); }

// Form submit
visitaForm.addEventListener('submit', async e => {
  e.preventDefault();
  const now = new Date();
  const data = {
    nome: visitaForm.nome.value.trim(),
    nascimento: visitaForm.nascimento.value,
    cpf: visitaForm.cpf.value.trim(),
    rua: visitaForm.rua.value.trim(),
    bairro: visitaForm.bairro.value.trim(),
    referencia: visitaForm.referencia.value.trim(),
    motivo: visitaForm.motivo.value.trim(),
    dificuldades: visitaForm.dificuldades.value.trim(),
    observacoes: visitaForm.observacoes.value.trim(),
    responsavel: visitaForm.responsavel.value.trim(),
    dataAgendamentoISO: now.toISOString(),
    dataAgendamento: now.toLocaleDateString('pt-BR'),
    horaAgendamento: now.toLocaleTimeString('pt-BR', {hour12:false}),
    status: 'Agendada',
    responsavelVisita:'',
    parecerVisita:'',
    dataRealizacao:''
  };

  try {
    await addDoc(collection(db,'visitas'), data);
    visitaForm.reset();
    loadVisitas();
    scrollToSection('visitas');
  } catch(err){
    console.error('Erro ao salvar visita:', err);
    alert('Erro ao salvar. Veja console.');
  }
});

// Criar card (somente visual)
function createCard(visita){
  const card = document.createElement('div');
  card.className='card';
  const statusClass = visita.status === 'Agendada' ? 'status-agendada' : 'status-realizada';
  card.innerHTML = `
    <p><strong>${escapeHtml(visita.nome)}</strong></p>
    <p class="muted">${escapeHtml(visita.dataAgendamento)}</p>
    <p class="status-label ${statusClass}">${escapeHtml(visita.status)}</p>
  `;
  visitasContainer.appendChild(card);
  setTimeout(()=>card.classList.add('show'),50);
}

// Carregar visitas
async function loadVisitas(){
  visitasContainer.innerHTML='';
  const snap = await getDocs(collection(db,'visitas'));
  let visitas = [];
  snap.forEach(s => visitas.push({...s.data(), id:s.id}));

  // Filtro por bairro
  if(currentFilter) visitas = visitas.filter(v=>v.bairro===currentFilter);

  // Filtro por busca
  if(searchQuery) visitas = visitas.filter(v=>v.nome.toLowerCase().includes(searchQuery.toLowerCase()));

  // Ordenação
  visitas.sort((a,b)=>{
    switch(currentSort){
      case 'agendadas-recentes': return new Date(b.dataAgendamentoISO||b.dataAgendamento) - new Date(a.dataAgendamentoISO||a.dataAgendamento);
      case 'agendadas-antigas': return new Date(a.dataAgendamentoISO||a.dataAgendamento) - new Date(b.dataAgendamentoISO||b.dataAgendamento);
      case 'realizadas-recentes': return (b.status==='Realizada'?1:0)-(a.status==='Realizada'?1:0) || new Date(b.dataRealizacao||b.dataAgendamentoISO||b.dataAgendamento)-new Date(a.dataRealizacao||a.dataAgendamentoISO||a.dataAgendamento);
      case 'realizadas-antigas': return (a.status==='Realizada'?1:0)-(b.status==='Realizada'?1:0) || new Date(a.dataRealizacao||a.dataAgendamentoISO||a.dataAgendamento)-new Date(b.dataRealizacao||b.dataAgendamentoISO||b.dataAgendamento);
      case 'alfabetica': return a.nome.localeCompare(b.nome);
      default: return 0;
    }
  });

  visitas.forEach(v => createCard(v));
}

// Filtros por bairro
bairroButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    currentFilter = btn.dataset.bairro || '';
    loadVisitas();
  });
});

// Busca por nome
searchInput.addEventListener('input', e=>{
  searchQuery = e.target.value.trim();
  loadVisitas();
});

// Ordenar menu
ordenarBtn.onclick = e=>{
  e.stopPropagation();
  ordenarMenu.style.display = ordenarMenu.style.display==='flex'?'none':'flex';
};
ordenarMenu.querySelectorAll('div').forEach(item=>{
  item.onclick = () => {
    currentSort = item.dataset.sort;
    ordenarMenu.style.display='none';
    loadVisitas();
  };
});
window.onclick = e=>{
  if(e.target !== ordenarBtn && e.target !== ordenarMenu) ordenarMenu.style.display='none';
};

// Utilitários
function escapeHtml(str){ if(!str && str!==0) return ''; return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

// Inicializar
loadVisitas();
