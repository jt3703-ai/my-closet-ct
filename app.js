// Version 2: invented wardrobe labels and explicit demonstration rules.
const wardrobe = [
  {id:'tee',name:'Cotton tee',category:'top',color:'cream',hex:'#ddd5c1',silhouette:'relaxed',style:'casual',warmth:1,hem:'hip',feel:'soft',rain:false,walking:false},
  {id:'knit',name:'Soft knit',category:'top',color:'cream',hex:'#c9bd9f',silhouette:'relaxed',style:'casual',warmth:2,hem:'hip',feel:'soft',rain:false,walking:false},
  {id:'shirt',name:'Crisp shirt',category:'top',color:'blue',hex:'#99b2bb',silhouette:'fitted',style:'smart',warmth:1,hem:'hip',feel:'crisp',rain:false,walking:false},
  {id:'ankle',name:'Ankle trousers',category:'bottom',color:'charcoal',hex:'#5d6560',silhouette:'straight',style:'casual',warmth:2,hem:'ankle',feel:'soft',rain:false,walking:false},
  {id:'long',name:'Long wide trousers',category:'bottom',color:'charcoal',hex:'#444d49',silhouette:'wide',style:'casual',warmth:2,hem:'floor',feel:'soft',rain:false,walking:false},
  {id:'cropped',name:'Cropped wide trousers',category:'bottom',color:'charcoal',hex:'#788176',silhouette:'wide',style:'casual',warmth:2,hem:'cropped',feel:'soft',rain:false,walking:false},
  {id:'raincoat',name:'Rain shell',category:'outerwear',color:'olive',hex:'#798569',silhouette:'relaxed',style:'casual',warmth:1,hem:'hip',feel:'smooth',rain:true,walking:false},
  {id:'jacket',name:'Soft jacket',category:'outerwear',color:'cream',hex:'#baad96',silhouette:'relaxed',style:'casual',warmth:2,hem:'hip',feel:'soft',rain:false,walking:false},
  {id:'boots',name:'Walking rain boots',category:'shoes',color:'charcoal',hex:'#424b44',silhouette:'rounded',style:'casual',warmth:2,hem:'not applicable',feel:'structured',rain:true,walking:true},
  {id:'flats',name:'Soft flats',category:'shoes',color:'charcoal',hex:'#877566',silhouette:'slim',style:'smart',warmth:1,hem:'not applicable',feel:'soft',rain:false,walking:false}
];
const situation = {rain:true,temperature:14,walkingMinutes:60};
const categories = ['top','bottom','outerwear','shoes'];
const reasons = {
  silhouette:'I prefer this silhouette.',
  match:'It matches the outfit better.',
  feel:'I prefer how it feels.'
};

// A concern is a possibility, never a measured comfort prediction.
function concernsFor(item) {
  const concerns = [];
  if (situation.rain && situation.walkingMinutes >= 45 && item.hem === 'floor')
    concerns.push('Floor-length hems might get wet during your extended walk in rain.');
  if (situation.rain && ['outerwear','shoes'].includes(item.category) && !item.rain)
    concerns.push('This item has no rain-resistant label in our simulated wardrobe, so rain might leave it damp.');
  if (item.category === 'top' && situation.temperature < 16 && item.warmth < 2)
    concerns.push('This light top might feel cool at 14°C; the model does not account for your personal temperature preference or the full effect of layers.');
  if (item.category === 'shoes' && situation.walkingMinutes >= 45 && !item.walking)
    concerns.push('These shoes have no walking-support label, so they might be less comfortable over the planned 60-minute walk.');
  return concerns;
}
function styleScore(item) {
  return Number(item.silhouette === 'relaxed') + Number(['cream','charcoal','olive'].includes(item.color)) + Number(item.style === 'casual');
}
function recommendOutfit() {
  return Object.fromEntries(categories.map(category => {
    const candidates = wardrobe.filter(item => item.category === category);
    candidates.sort((a,b) => concernsFor(a).length - concernsFor(b).length || styleScore(b) - styleScore(a));
    return [category,candidates[0].id]; // Original array order breaks ties.
  }));
}
function matchesPreference(candidate,selected,reason) {
  if (reason === 'silhouette') return candidate.silhouette === selected.silhouette;
  // Overall coordination belongs to the user; do not infer it from item labels.
  if (reason === 'match') return true;
  if (reason === 'feel') return candidate.feel === selected.feel;
  return false;
}
function findAlternative(selected,reason) {
  return wardrobe.filter(item => item.category === selected.category && item.id !== selected.id &&
    matchesPreference(item,selected,reason) && concernsFor(item).length < concernsFor(selected).length)
    .sort((a,b) => concernsFor(a).length - concernsFor(b).length ||
      (reason === 'match' ? 0 : styleScore(b) - styleScore(a)))[0] || null;
}
function guidanceFor(item) {
  if (item.category === 'bottom') return 'If you keep this pair, consider a sheltered route or shortening exposed stretches. If the garment allows it, temporarily turning up the hems may help; check that you like the resulting fit.';
  if (item.category === 'shoes') return 'If you keep these shoes, consider sheltered breaks and carrying dry socks. These steps may reduce inconvenience, but do not guarantee comfort.';
  if (item.category === 'outerwear') return 'If you keep this layer, consider an umbrella where practical and sheltered pauses to reduce rain exposure.';
  return 'If you keep this top, you can keep your selected outer layer on and seek sheltered breaks if you feel cold.';
}
function feedbackFor(selected,reason,outfit) {
  const acknowledgments = {
    silhouette:`You chose ${selected.name} because you prefer its silhouette. That preference is yours to define.`,
    match:`You chose ${selected.name} because you feel it coordinates better with the complete outfit. We accept your judgment about the overall look; matching clothing labels cannot establish aesthetic compatibility.`,
    feel:`You chose ${selected.name} because you prefer how it feels. Your experience matters more than our simplified fabric-feel label.`
  };
  const concerns = Object.values(outfit).flatMap(id => {
    const item = wardrobe.find(entry => entry.id === id);
    return concernsFor(item).map(text => `${item.name}: ${text}`);
  });
  const alternative = findAlternative(selected,reason);
  const basis = {silhouette:'silhouette',match:'color or style',feel:'fabric-feel'}[reason];
  const coordinationAlternative = alternative
    ? `Optional practical alternative: ${alternative.name} is already in your wardrobe and has fewer flagged practical concerns. You decide whether it works with the complete outfit; the model cannot establish aesthetic compatibility. Your selected item stays in the outfit unless you choose to swap it.`
    : 'No other owned item in this category has fewer flagged practical concerns. Your selected item remains in the outfit; the model cannot judge how an alternative would coordinate with the overall look.';
  return {
    acknowledgment:acknowledgments[reason], concerns,
    alternative:reason === 'match' ? coordinationAlternative : alternative ? `Optional: ${alternative.name} is already in your wardrobe, shares a ${basis} label with your choice, and has fewer flagged concerns. That does not guarantee an equivalent look or feel. You can select it through the same swap form if you want.` : 'No owned item meets both this preference-matching rule and the requirement for fewer flagged concerns. Your selected item remains in the outfit.',
    guidance:guidanceFor(selected)
  };
}

// Rendering and the single swap form. Selecting controls does not alter the outfit.
let currentOutfit = recommendOutfit();
function itemCard(item,compact=false) {
  const card = document.createElement('div');
  card.className = 'item' + (compact && Object.values(currentOutfit).includes(item.id) ? ' selected' : '');
  const art = document.createElement('div'); art.className = `art ${item.category}`; art.setAttribute('aria-hidden','true');
  const shape = document.createElement('span'); shape.className = 'garment'; shape.style.setProperty('--cloth',item.hex); art.append(shape);
  const name = document.createElement('strong'); name.textContent = item.name;
  const description = document.createElement('small'); description.textContent = compact ? `${item.color} · ${item.silhouette}` : `${item.silhouette} · ${item.hem === 'not applicable' ? item.feel : item.hem + ' hem'}`;
  card.title = `${item.category}; ${item.color}; ${item.silhouette}; ${item.style}; warmth ${item.warmth}/2; hem: ${item.hem}; feel: ${item.feel}; rain resistant: ${item.rain}; walking support: ${item.walking}`;
  card.append(art,name,description); return card;
}
function renderOutfit() {
  document.querySelector('#outfit').replaceChildren(...categories.map(category => itemCard(wardrobe.find(item => item.id === currentOutfit[category]))));
  document.querySelector('#wardrobe').replaceChildren(...wardrobe.map(item => itemCard(item,true)));
}
function populateReplacements(preferredId,includeCurrent=false) {
  const category = document.querySelector('#category').value;
  const select = document.querySelector('#replacement');
  select.replaceChildren();
  wardrobe.filter(item => item.category === category && (includeCurrent || item.id !== currentOutfit[category])).forEach(item => {
    const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; select.append(option);
  });
  if (preferredId && [...select.options].some(option => option.value === preferredId)) select.value = preferredId;
}
function feedbackBlock(title,text,className='') {
  const block = document.createElement('div'); block.className = `feedback-block ${className}`;
  const heading = document.createElement('h3'); heading.textContent = title; block.append(heading);
  if (Array.isArray(text)) {
    const list = document.createElement('ul'); text.forEach(line => {const li = document.createElement('li'); li.textContent = line; list.append(li);}); block.append(list);
  } else {const p = document.createElement('p'); p.textContent = text; block.append(p);}
  return block;
}
function submitSwap(event) {
  event.preventDefault();
  const selected = wardrobe.find(item => item.id === document.querySelector('#replacement').value);
  const reason = document.querySelector('#reason').value;
  if (!selected || !reasons[reason] || selected.category !== document.querySelector('#category').value) return;
  currentOutfit = {...currentOutfit,[selected.category]:selected.id};
  const feedback = feedbackFor(selected,reason,currentOutfit);
  renderOutfit();
  document.querySelector('#outfit-status').textContent = 'Your choice is kept';
  document.querySelector('#feedback').replaceChildren(
    feedbackBlock('Your preference',feedback.acknowledgment),
    feedbackBlock('Possible practical concerns',feedback.concerns.length ? feedback.concerns : 'No concerns are flagged by these limited rules. This does not mean comfort is guaranteed.','concerns'),
    feedbackBlock('An owned alternative',feedback.alternative),
    feedbackBlock('If you keep your choice',feedback.guidance)
  );
  // Keep the submitted item visible in the selector as well as the outfit.
  populateReplacements(selected.id,true);
  const kept = document.querySelector('#replacement').selectedOptions[0];
  kept.textContent = selected.name + ' — kept in your outfit';
}
document.querySelector('#category').addEventListener('change',() => populateReplacements());
document.querySelector('#swap-form').addEventListener('submit',submitSwap);
renderOutfit();
populateReplacements('long');
