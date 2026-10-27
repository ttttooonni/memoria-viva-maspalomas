(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
  const tabs = [...document.querySelectorAll(".game-tab")];
  const panels = [...document.querySelectorAll(".game-panel")];
  let playMode = "solo", difficulty = "medio";
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  const levelButtons = [...document.querySelectorAll("[data-level]")];
  function updateGuidance() {
    const guidance = $("play-guidance");
    if (!guidance) return;
    const modeText = playMode === "acompanado"
      ? "Modo en compañía: una persona puede leer las instrucciones, dar pistas y celebrar cada intento. Preguntad siempre si la persona quiere ayuda."
      : "Modo a mi ritmo: juega por tu cuenta o pide ayuda cuando te apetezca. Puedes parar o cambiar de juego en cualquier momento.";
    const levelText = difficulty === "facil"
      ? "Nivel tranquilo: menos cartas, pistas claras y palabras sencillas."
      : difficulty === "reto"
        ? "Un pequeño reto: más cartas y palabras de partida menos habituales. Sin cronómetro ni penalizaciones."
        : "Nivel habitual: una dificultad intermedia, adaptable según el día.";
    guidance.textContent = modeText + " " + levelText;
  }
  modeButtons.forEach((button) => button.addEventListener("click", () => {
    playMode = button.dataset.mode;
    modeButtons.forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    updateGuidance();
    const support = $("prompt-support");
    if (support) support.textContent = playMode === "acompanado"
      ? "La persona acompañante puede leer despacio, escuchar sin corregir y dejar que la persona decida si quiere contar algo. También está bien pasar a otra pregunta."
      : "Puedes responder hablando, señalando una imagen o simplemente escuchando. No tienes que compartir nada que no te apetezca.";
  }));
  levelButtons.forEach((button) => button.addEventListener("click", () => {
    difficulty = button.dataset.level;
    levelButtons.forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    updateGuidance();
    if (typeof setupMemory === "function") setupMemory();
    if (typeof resetWordGame === "function") resetWordGame();
    if (typeof newScene === "function") newScene();
  }));
  updateGuidance();
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => { const active = item === tab; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === "game-" + tab.dataset.game));
  }));
  const year = $("year"); if (year) year.textContent = new Date().getFullYear();
  const config = window.MEMORIA_VIVA_CONFIG || {};
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    const message = link.dataset.message || "Hola, quiero información sobre Memoria Viva Maspalomas.";
    if (number.length >= 8) { link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; }
  });
  const menuToggle = document.querySelector(".menu-toggle"), nav = $("nav-menu");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); menuToggle.setAttribute("aria-expanded", String(open)); menuToggle.textContent = open ? "×" : "☰"; menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.textContent = "☰"; }));
  }

  // Juego 1: parejas. No hay reloj ni penalización.
  const symbols = ["🌻", "☕", "🎸", "🐚", "🍊", "📚", "🧶", "🌼"];
  let deck = [], firstCard = null, lockBoard = false, matchedPairs = 0, turns = 0, memoryPairCount = 6;
  function setupMemory() {
    memoryPairCount = difficulty === "facil" ? 3 : difficulty === "reto" ? 8 : 6;
    deck = shuffle([...symbols.slice(0, memoryPairCount), ...symbols.slice(0, memoryPairCount)]); firstCard = null; lockBoard = false; matchedPairs = 0; turns = 0;
    $("memory-grid").innerHTML = ""; $("memory-status").textContent = "Pulsa dos cartas para empezar."; $("memory-pairs").textContent = "Parejas: 0 de " + memoryPairCount;
    deck.forEach((symbol, index) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "memory-card"; button.dataset.symbol = symbol; button.dataset.index = String(index); button.textContent = "✳"; button.setAttribute("aria-label", "Carta " + (index + 1) + ", oculta");
      button.addEventListener("click", () => flipCard(button)); $("memory-grid").appendChild(button);
    });
  }
  function flipCard(button) {
    if (lockBoard || button.disabled || button === firstCard || button.classList.contains("revealed")) return;
    button.textContent = button.dataset.symbol; button.classList.add("revealed"); button.setAttribute("aria-label", "Carta: " + button.dataset.symbol);
    if (!firstCard) { firstCard = button; $("memory-status").textContent = "Ahora busca otra carta igual."; return; }
    turns++; const second = button;
    if (firstCard.dataset.symbol === second.dataset.symbol) {
      [firstCard, second].forEach((card) => { card.classList.remove("revealed"); card.classList.add("matched"); card.disabled = true; }); matchedPairs++;
      $("memory-pairs").textContent = "Parejas: " + matchedPairs + " de " + memoryPairCount;
      $("memory-status").textContent = matchedPairs === memoryPairCount ? "¡Habéis encontrado todas las parejas! ¡Bien hecho!" : "¡Pareja encontrada! Seguimos cuando quieras.";
      firstCard = null;
    } else {
      lockBoard = true; $("memory-status").textContent = "No pasa nada. Vamos a probar con otras cartas.";
      const previous = firstCard; firstCard = null;
      window.setTimeout(() => { [previous, second].forEach((card) => { card.classList.remove("revealed"); card.textContent = "✳"; card.setAttribute("aria-label", "Carta " + (Number(card.dataset.index) + 1) + ", oculta"); }); lockBoard = false; }, 1100);
    }
  }
  $("memory-reset").addEventListener("click", setupMemory); setupMemory();

  // Juego 2: refranes populares.
  const proverbs = [
    {q:"A quien madruga…",a:["Dios le ayuda","le entra sueño","se le hace tarde"],correct:0},
    {q:"Más vale pájaro en mano…",a:["que ciento volando","que una flor en mayo","que un pez en el río"],correct:0},
    {q:"No por mucho madrugar…",a:["amanece más temprano","se llega más lejos","se duerme mejor"],correct:0},
    {q:"En abril, aguas…",a:["mil","de jazmín","para el jardín"],correct:0},
    {q:"A caballo regalado…",a:["no le mires el diente","dale heno primero","déjalo descansar"],correct:0},
    {q:"De tal palo…",a:["tal astilla","tal camino","tal ventana"],correct:0},
    {q:"Al mal tiempo…",a:["buena cara","buen paraguas siempre","mejor quedarse quieto"],correct:0},
    {q:"Quien tiene un amigo…",a:["tiene un tesoro","tiene una casa","tiene dos sombreros"],correct:0},
    {q:"A falta de pan…",a:["buenas son tortas","bueno es el queso","mejor una sopa"],correct:0},
    {q:"Perro ladrador…",a:["poco mordedor","mucho soñador","buen cuidador"],correct:0}
  ];
  let proverbDeck = shuffle(proverbs), proverbIndex = 0;
  function showProverb() {
    if (proverbIndex >= proverbDeck.length) { proverbDeck = shuffle(proverbs); proverbIndex = 0; }
    const item = proverbDeck[proverbIndex]; $("proverb-counter").textContent = "Refrán " + (proverbIndex + 1) + " de " + proverbDeck.length; $("proverb-question").textContent = item.q; $("proverb-feedback").textContent = ""; $("proverb-options").innerHTML = "";
    item.a.forEach((answer, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.dataset.correct = String(index === item.correct); button.addEventListener("click", () => {
      [...$("proverb-options").children].forEach((b) => b.disabled = true);
      if (index === item.correct) { button.classList.add("correct"); $("proverb-feedback").textContent = "¡Sí! Ese es el refrán más conocido. ¿En tu familia se decía de otra manera?"; }
      else { button.classList.add("incorrect"); $("proverb-options").children[item.correct].classList.add("correct"); $("proverb-feedback").textContent = "Una versión muy conocida es: " + item.q + " " + item.a[item.correct] + ". ¡También podéis compartir variantes!"; }
    }); $("proverb-options").appendChild(button); });
  }
  $("proverb-next").addEventListener("click", () => { proverbIndex++; showProverb(); }); showProverb();

  // Juego 3: cadena de palabras. Se comprueba la letra inicial, no el diccionario.
  let currentWord = "MESA", wordHistory = ["MESA"];
  function resetWordGame() { currentWord = difficulty === "facil" ? "CASA" : difficulty === "reto" ? "AZAHAR" : "MESA"; wordHistory = [currentWord]; $("word-feedback").textContent = "Empezamos de nuevo con " + currentWord + "."; renderWord(); }
  function renderWord() { $("word-current").textContent = currentWord; $("word-prompt").textContent = "Busca una palabra que empiece por " + currentWord.slice(-1).toLocaleUpperCase("es") + "."; $("word-history").innerHTML = ""; wordHistory.forEach((word) => { const chip = document.createElement("span"); chip.className = "word-chip"; chip.textContent = word; $("word-history").appendChild(chip); }); }
  $("word-form").addEventListener("submit", (event) => {
    event.preventDefault(); const raw = $("word-input").value.trim(); const word = normalize(raw); const required = normalize(currentWord.slice(-1));
    if (!word || !/^[a-zñáéíóúü]+$/i.test(raw)) { $("word-feedback").textContent = "Prueba con una palabra sencilla, sin números."; return; }
    if (word[0] !== required) { $("word-feedback").textContent = "La palabra debe empezar por " + required.toLocaleUpperCase("es") + ". ¡Inténtalo de nuevo!"; return; }
    if (wordHistory.some((used) => normalize(used) === word)) { $("word-feedback").textContent = "Ya hemos usado esa palabra. ¿Se te ocurre otra?"; return; }
    currentWord = raw.toLocaleUpperCase("es"); wordHistory.push(currentWord); $("word-input").value = ""; $("word-feedback").textContent = "¡Buena palabra! Ahora toca empezar por " + currentWord.slice(-1) + "."; renderWord();
  });
  $("word-reset").addEventListener("click", () => { resetWordGame(); }); renderWord();

  // Juego 4: pistas musicales descriptivas; no incluye letras ni grabaciones.
  const songs = [
    {clue:"Una canción italiana muy conocida cuyo título invita a volar y que se hizo famosa internacionalmente en los años cincuenta.",a:["Volare (Nel blu dipinto di blu)","La Macarena","Bésame mucho"],correct:0},
    {clue:"Un pasodoble español muy popular que suele sonar en fiestas y verbenas, y que comparte nombre con una ciudad de la Comunidad Valenciana.",a:["Valencia","Zaragoza","Sevilla"],correct:0},
    {clue:"Una canción tradicional de cumpleaños que muchas familias cantan cuando alguien sopla las velas.",a:["Cumpleaños feliz","La Tarara","Asturias, patria querida"],correct:0},
    {clue:"Una canción popular española asociada a una muñeca vestida de azul y a una historia contada con humor.",a:["Tengo una muñeca vestida de azul","Clavelitos","La chica ye-yé"],correct:0},
    {clue:"Una canción tradicional muy vinculada a Asturias, que también se canta en reuniones y celebraciones.",a:["Asturias, patria querida","Granada","La bamba"],correct:0},
    {clue:"Una canción festiva que se hizo mundialmente conocida por su baile con pasos de brazos y caderas.",a:["La Macarena","Volare","Resistiré"],correct:0}
  ];
  let songDeck = shuffle(songs), songIndex = 0;
  function showSong() {
    if (songIndex >= songDeck.length) { songDeck = shuffle(songs); songIndex = 0; }
    const item = songDeck[songIndex]; $("song-counter").textContent = "Pista " + (songIndex + 1) + " de " + songDeck.length; $("song-clue").textContent = item.clue; $("song-feedback").textContent = ""; $("song-options").innerHTML = "";
    shuffle(item.a.map((answer, index) => ({answer,index}))).forEach(({answer,index}) => { const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.dataset.correct = String(index === item.correct); button.addEventListener("click", () => {
      [...$("song-options").children].forEach((b) => b.disabled = true);
      if (index === item.correct) { button.classList.add("correct"); $("song-feedback").textContent = "¡Exacto! ¿La conocíais? Podéis tararearla o contar cuándo la escuchasteis."; }
      else { button.classList.add("incorrect"); [...$("song-options").children].forEach((b) => { if (b.textContent === item.a[item.correct]) b.classList.add("correct"); }); $("song-feedback").textContent = "La respuesta más adecuada es " + item.a[item.correct] + ". ¡A veces una canción trae muchas historias!"; }
    }); $("song-options").appendChild(button); });
  }
  $("song-next").addEventListener("click", () => { songIndex++; showSong(); }); showSong();

  // Juego 5: escena de objetos con un cambio por ronda.
  const scenes = [
    [{icon:"☕",name:"taza"},{icon:"📚",name:"libros"},{icon:"🌷",name:"flor"},{icon:"🔑",name:"llaves"},{icon:"🍎",name:"manzana"}],
    [{icon:"🕶️",name:"gafas"},{icon:"🧣",name:"bufanda"},{icon:"🕰️",name:"reloj"},{icon:"🧤",name:"guantes"},{icon:"🧢",name:"gorra"}],
    [{icon:"🍋",name:"limón"},{icon:"🥄",name:"cuchara"},{icon:"🍞",name:"pan"},{icon:"🫖",name:"tetera"},{icon:"🍐",name:"pera"}],
    [{icon:"✉️",name:"carta"},{icon:"✏️",name:"lápiz"},{icon:"📷",name:"cámara"},{icon:"🧵",name:"hilo"},{icon:"🪴",name:"planta"}]
  ];
  let scene = [], changed = null, scenePhase = "observe", previousScenes = [];
  function drawScene() { $("object-scene").innerHTML = ""; scene.forEach((item) => { const el = document.createElement("div"); el.className = "scene-object"; el.innerHTML = "<span aria-hidden=\"true\">" + item.icon + "</span><small>" + item.name + "</small>"; $("object-scene").appendChild(el); }); }
  function newScene() {
    let options = scenes.filter((_, i) => !previousScenes.includes(i)); if (!options.length) { previousScenes = []; options = scenes; }
    const index = scenes.indexOf(options[Math.floor(Math.random() * options.length)]); previousScenes.push(index); if (previousScenes.length > 2) previousScenes.shift();
    scene = [...scenes[index]]; changed = null; scenePhase = "observe"; $("scene-instruction").textContent = "Observa los cinco objetos. Cuando estés preparado, pulsa «Ya la he observado»."; $("scene-feedback").textContent = ""; $("scene-answers").innerHTML = ""; $("scene-show").disabled = false; drawScene();
  }
  $("scene-show").addEventListener("click", () => {
    if (scenePhase !== "observe") return;
    const index = Math.floor(Math.random() * scene.length); const original = scene[index]; const replacements = scenes.flat().filter((item) => item.name !== original.name && !scene.some((s) => s.name === item.name)); const replacement = replacements[Math.floor(Math.random() * replacements.length)];
    changed = {old: original, next: replacement}; scene[index] = replacement; scenePhase = "answer"; $("scene-instruction").textContent = "Un objeto ha cambiado. ¿Cuál crees que es el diferente?"; $("scene-show").disabled = true; drawScene();
    const choices = shuffle([original, replacement, ...scene.filter((item) => item.name !== replacement.name).slice(0,2)]);
    choices.forEach((item) => { const button = document.createElement("button"); button.type = "button"; button.className = "scene-answer"; button.textContent = item.name; button.addEventListener("click", () => {
      [...$("scene-answers").children].forEach((b) => b.disabled = true);
      if (item.name === replacement.name) { $("scene-feedback").textContent = "¡Bien visto! Ha aparecido " + replacement.name + " en lugar de " + original.name + ". ¿Jugamos otra vez?"; }
      else { $("scene-feedback").textContent = "El objeto que ha cambiado es " + replacement.name + ": antes estaba " + original.name + ". ¡Podemos intentarlo otra vez sin prisa!"; }
      $("scene-instruction").textContent = "Ronda terminada. Puedes empezar una nueva escena.";
    }); $("scene-answers").appendChild(button); });
  });
  $("scene-reset").addEventListener("click", newScene); newScene();

  // Juego 6: preguntas abiertas para conversación. No almacena respuestas.
  const prompts = [
    ["LUGARES","¿Había algún lugar al que te gustara ir de paseo?"],
    ["MÚSICA","¿Qué música te gustaba escuchar cuando eras joven?"],
    ["COCINA","¿Qué comida te recuerda a alguien querido?"],
    ["JUEGOS","¿A qué jugabas cuando eras pequeño o pequeña?"],
    ["CELEBRACIONES","¿Qué celebración disfrutabas especialmente?"],
    ["NATURALEZA","¿Había alguna planta o flor que te gustara cuidar?"],
    ["OFICIOS","¿Qué trabajo o oficio te ha parecido siempre interesante?"],
    ["OBJETOS","¿Conservas o recuerdas algún objeto con una historia especial?"],
    ["AMISTAD","¿Qué cualidad valoras mucho en una amistad?"],
    ["COSTUMBRES","¿Qué pequeña costumbre te alegra el día?"],
    ["VIAJES","¿Qué lugar te gustaría volver a visitar, aunque sea en recuerdos?"],
    ["SABORES","¿Qué olor de cocina te resulta especialmente familiar?"],
    ["FIESTAS","¿Qué canción o baile recuerdas de las fiestas del pueblo?"],
    ["GRAN CANARIA","¿Hay algún rincón de Gran Canaria al que te guste volver?"],
    ["GASTRONOMÍA CANARIA","¿Qué plato canario te recuerda a reuniones familiares?"],
    ["MÚSICA CANARIA","¿Has escuchado tocar el timple en alguna fiesta o reunión?"],
    ["TRADICIONES","¿Recuerdas alguna romería, fiesta o celebración de tu barrio?"],
    ["PAISAJES","¿Qué paisaje de las islas te parece especialmente bonito?"],
    ["NUEVOS RECUERDOS","¿Qué te gustaría hacer esta semana por puro gusto?"]
  ];
  let promptDeck = shuffle(prompts), promptIndex = 0, favouritePrompts = new Set();
  function showPrompt() { if (promptIndex >= promptDeck.length) { promptDeck = shuffle(prompts); promptIndex = 0; } const item = promptDeck[promptIndex]; $("memory-category").textContent = item[0]; $("memory-prompt").textContent = item[1]; $("prompt-feedback").textContent = ""; $("prompt-fav").textContent = favouritePrompts.has(item[1]) ? "♥ Pregunta guardada en esta sesión" : "♡ Me gusta esta pregunta"; }
  $("prompt-next").addEventListener("click", () => { promptIndex++; showPrompt(); });
  $("prompt-fav").addEventListener("click", () => { const item = promptDeck[promptIndex][1]; if (favouritePrompts.has(item)) { favouritePrompts.delete(item); $("prompt-feedback").textContent = "Pregunta quitada de favoritas."; } else { favouritePrompts.add(item); $("prompt-feedback").textContent = "Marcada como favorita mientras esta página esté abierta."; } showPrompt(); $("prompt-feedback").textContent = favouritePrompts.has(item) ? "Marcada como favorita mientras esta página esté abierta." : "Pregunta quitada de favoritas."; });
  showPrompt();

  // Juego 7: cultura canaria, pensado para conversar y compartir recuerdos.
  const canaryQuestions = [
    {q:"¿Con qué se elabora tradicionalmente el gofio?",a:["Con cereales tostados y molidos","Con patata y queso","Con plátano y miel"],correct:0},
    {q:"¿Qué instrumento de cuerda es muy representativo de la música canaria?",a:["El timple","La gaita escocesa","La mandolina rusa"],correct:0},
    {q:"¿Cómo se suelen servir las papas arrugadas?",a:["Con su piel y sal, a menudo con mojo","Peladas y cubiertas de azúcar","En puré con nata"],correct:0},
    {q:"¿Qué formación rocosa es uno de los símbolos naturales de Gran Canaria?",a:["Roque Nublo","La Alhambra","Los Picos de Europa"],correct:0},
    {q:"¿Qué suele ser una romería tradicional?",a:["Una celebración popular con música y costumbres locales","Una competición de natación","Una exposición de coches"],correct:0},
    {q:"¿Qué fruta se cultiva ampliamente en Canarias y es conocida por su dulzor?",a:["El plátano","El arándano ártico","La grosella negra"],correct:0},
    {q:"¿Qué salsa canaria se sirve a menudo con papas arrugadas?",a:["Mojo","Pesto genovés","Salsa tártara"],correct:0},
    {q:"¿Qué nombre recibe una actividad tradicional de lucha canaria?",a:["Intentar derribar al contrario siguiendo reglas propias","Golpear una pelota con raqueta","Lanzar discos a una diana"],correct:0},
    {q:"¿Qué paisaje natural es muy conocido en Gran Canaria?",a:["Las dunas de Maspalomas","El glaciar Perito Moreno","El fiordo de Geiranger"],correct:0},
    {q:"¿Qué se puede encontrar en una fiesta tradicional canaria?",a:["Música, comida compartida y tradiciones locales","Solo deportes de invierno","Únicamente carreras de coches"],correct:0},
    {q:"¿Qué tipo de leche se usa tradicionalmente en muchos quesos canarios?",a:["Leche de cabra","Leche de reno","Leche de búfala exclusivamente"],correct:0},
    {q:"¿Qué instrumento puede acompañar una isa canaria?",a:["Timple","Didgeridoo","Balalaica"],correct:0}
  ];
  let canaryDeck = shuffle(canaryQuestions), canaryIndex = 0;
  function showCanaryQuestion() {
    if (canaryIndex >= canaryDeck.length) { canaryDeck = shuffle(canaryQuestions); canaryIndex = 0; }
    const item = canaryDeck[canaryIndex];
    $("canary-counter").textContent = "Pregunta " + (canaryIndex + 1) + " de " + canaryDeck.length;
    $("canary-question").textContent = item.q; $("canary-feedback").textContent = ""; $("canary-options").innerHTML = "";
    shuffle(item.a.map((answer, index) => ({answer,index}))).forEach(({answer,index}) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.dataset.correct = String(index === item.correct);
      button.addEventListener("click", () => {
        [...$("canary-options").children].forEach((b) => b.disabled = true);
        if (index === item.correct) {
          button.classList.add("correct");
          $("canary-feedback").textContent = "¡Así es! ¿Qué recuerdo, receta o historia te viene a la cabeza al hablar de esto?";
        } else {
          button.classList.add("incorrect");
          [...$("canary-options").children].forEach((b) => { if (b.textContent === item.a[item.correct]) b.classList.add("correct"); });
          $("canary-feedback").textContent = "La respuesta que buscábamos era: " + item.a[item.correct] + ". No pasa nada: ¿conocías alguna historia relacionada?";
        }
      });
      $("canary-options").appendChild(button);
    });
  }
  $("canary-next").addEventListener("click", () => { canaryIndex++; showCanaryQuestion(); });
  showCanaryQuestion();

  // Ayudas universales: voz opcional, pistas amables y preferencias solo en memoria de sesión.
  const interestButtons = [...document.querySelectorAll("[data-interest]")];
  const selectedInterests = new Set(interestButtons.filter((button) => button.classList.contains("active")).map((button) => button.dataset.interest));
  const interestMap = {"LUGARES":["LUGARES","VIAJES","GRAN CANARIA","PAISAJES"],"MÚSICA":["MÚSICA","MÚSICA CANARIA","FIESTAS"],"COCINA":["COCINA","SABORES","GASTRONOMÍA CANARIA"],"TRADICIONES":["TRADICIONES","CELEBRACIONES","FIESTAS","COSTUMBRES"],"NATURALEZA":["NATURALEZA","PAISAJES","GRAN CANARIA"],"OTROS":["JUEGOS","OFICIOS","OBJETOS","AMISTAD","NUEVOS RECUERDOS"]};
  function makePromptDeck(){const allowed=new Set([...selectedInterests].flatMap((key)=>interestMap[key]||[]));const filtered=prompts.filter((item)=>allowed.has(item[0]));return shuffle(filtered.length?filtered:prompts);}
  interestButtons.forEach((button)=>button.addEventListener("click",()=>{const key=button.dataset.interest;if(selectedInterests.has(key))selectedInterests.delete(key);else selectedInterests.add(key);if(!selectedInterests.size)selectedInterests.add(key);interestButtons.forEach((item)=>{const active=selectedInterests.has(item.dataset.interest);item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));});promptDeck=makePromptDeck();promptIndex=0;showPrompt();$("prompt-feedback").textContent="Preguntas adaptadas a tus temas favoritos."; }));
  function stopVoice(){if("speechSynthesis" in window)window.speechSynthesis.cancel();}
  function speakText(text,feedback){if(!("speechSynthesis" in window)||!text.trim()){if(feedback)feedback.textContent="La lectura en voz alta no está disponible en este navegador. Puedes leer el texto o pedir que te lo lean.";return;}stopVoice();const utterance=new SpeechSynthesisUtterance(text);utterance.lang="es-ES";utterance.rate=0.88;utterance.pitch=1;utterance.onstart=()=>{if(feedback)feedback.textContent="Leyendo en voz alta…";};utterance.onend=()=>{if(feedback)feedback.textContent="Lectura terminada.";};utterance.onerror=()=>{if(feedback)feedback.textContent="No se pudo iniciar la voz. Puedes intentarlo de nuevo.";};window.speechSynthesis.speak(utterance);}
  function textForPanel(panel){const title=panel.querySelector("h3")?.textContent||"";const question=panel.querySelector("#proverb-question, #song-clue, #canary-question, #word-prompt, #scene-instruction, #memory-prompt, #photo-prompt")?.textContent||"";const options=[...panel.querySelectorAll(".quiz-option:not(:disabled), .scene-answer:not(:disabled)")].map((b)=>b.textContent).join(". ");const scene=panel.querySelector("#object-scene")?.textContent||"";return[title,question,options,scene].filter(Boolean).join(". ");}
  function giveHint(panel,feedback){const id=panel.id;if(id==="game-palabras"){const letter=$("word-current")?.textContent.slice(-1)||"A";feedback.textContent="Pista: piensa en una palabra cotidiana que empiece por «"+letter+"». También puedes decirla en voz alta en vez de escribirla.";return;}if(id==="game-recuerdos"){feedback.textContent="Pista: puedes empezar por una persona, un lugar, un olor o una canción. También puedes pasar a otra pregunta; no tienes que contar nada personal.";return;}if(id==="game-fotografias"){feedback.textContent="Pista: fíjate primero en los colores y las formas. Después puedes hablar de un lugar parecido, de un paseo o de lo que te hace sentir la imagen.";return;}if(id==="game-parejas"){feedback.textContent="Pista: empieza con dos cartas. Si no coinciden, observa dónde están y vuelve a probar sin prisa.";return;}if(id==="game-cambios"){feedback.textContent="Pista: compara los objetos uno a uno. Puedes leer sus nombres en voz alta y tomarte todo el tiempo que quieras.";return;}const wrong=[...panel.querySelectorAll(".quiz-option:not(:disabled)")].find((button)=>button.dataset.correct==="false");if(wrong){wrong.disabled=true;wrong.classList.add("hinted-option");feedback.textContent="Aquí tienes una pista: hemos apartado una opción que no era la respuesta. Puedes elegir entre las restantes.";}else feedback.textContent="Pista: lee las opciones en voz alta y elige la que te resulte más familiar. No hay prisa.";}
  function addAssistiveTools(){document.querySelectorAll(".game-panel").forEach((panel)=>{if(panel.querySelector(".assistive-tools"))return;const tools=document.createElement("div");tools.className="assistive-tools";const listen=document.createElement("button");listen.type="button";listen.className="assistive-button";listen.textContent="🔊 Escuchar";listen.setAttribute("aria-label","Leer en voz alta el contenido de este juego");const hint=document.createElement("button");hint.type="button";hint.className="assistive-button";hint.textContent="💡 Dar una pista";const stop=document.createElement("button");stop.type="button";stop.className="assistive-button";stop.textContent="■ Parar voz";const feedback=document.createElement("p");feedback.className="assistive-feedback";feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");listen.addEventListener("click",()=>speakText(textForPanel(panel),feedback));stop.addEventListener("click",()=>{stopVoice();feedback.textContent="Lectura detenida.";});hint.addEventListener("click",()=>giveHint(panel,feedback));tools.append(listen,hint,stop,feedback);const target=panel.querySelector(".quiz-card, .word-card, .scene-card, .memory-prompt-card, .photo-question");if(target)target.appendChild(tools);else panel.appendChild(tools);});}
  addAssistiveTools();
  const photos=[
  {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Roque_Nublo,_gran_canaria.JPG?width=1000",alt:"El Roque Nublo, formación rocosa de Gran Canaria",title:"¿Qué te llama la atención de este paisaje?",category:"PAISAJES",support:"Puedes describir lo que ves, contar si has estado allí o elegir otra fotografía.",credit:'Fotografía: Donarreiskoffer · CC BY 3.0 · <a href="https://commons.wikimedia.org/wiki/File:Roque_Nublo,_gran_canaria.JPG" target="_blank" rel="noopener noreferrer">Ver fuente y licencia</a>',topic:"LUGARES"},
  {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Dunas_de_Maspalomas,_Gran_Canaria.jpg?width=1000",alt:"Dunas de Maspalomas en Gran Canaria",title:"¿Te recuerda a algún paseo, día de playa o viaje?",category:"RECUERDOS Y LUGARES",support:"Puedes hablar del mar, la arena, el viento o de otro lugar que te guste.",credit:'Fotografía: Marcela Střelcová · CC BY-SA 4.0 · <a href="https://commons.wikimedia.org/wiki/File:Dunas_de_Maspalomas,_Gran_Canaria.jpg" target="_blank" rel="noopener noreferrer">Ver fuente y licencia</a>',topic:"LUGARES"},
  {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Timple-001.jpg?width=1000",alt:"Un timple canario de cinco cuerdas",title:"¿Qué música o celebración te viene a la cabeza al ver este instrumento?",category:"MÚSICA CANARIA",support:"Quizá recuerdes una fiesta, una isa, una parranda o una canción familiar.",credit:'Fotografía: Villanueva · CC BY-SA 3.0 · <a href="https://commons.wikimedia.org/wiki/File:Timple-001.jpg" target="_blank" rel="noopener noreferrer">Ver fuente y licencia</a>',topic:"MÚSICA"}];
  let photoIndex=0;
  function showPhoto(){const photo=photos[photoIndex%photos.length];$("photo-image").src=photo.src;$("photo-image").alt=photo.alt;$("photo-category").textContent=photo.category;$("photo-prompt").textContent=photo.title;$("photo-support").textContent=photo.support;$("photo-credit").innerHTML=photo.credit;$("photo-feedback").textContent="";}
  $("photo-next").addEventListener("click",()=>{photoIndex=(photoIndex+1)%photos.length;showPhoto();});
  $("photo-listen").addEventListener("click",()=>speakText($("photo-prompt").textContent+". "+$("photo-support").textContent,$("photo-feedback")));
  $("photo-stop").addEventListener("click",()=>{stopVoice();$("photo-feedback").textContent="Lectura detenida.";});

})();