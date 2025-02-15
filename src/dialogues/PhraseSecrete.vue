<template>
<q-dialog v-model="ui.d.a.phrasesecrete" persistent position="top"
  transition-show="slide-down" transition-hide="fade">
  <q-card :class="styp('sm')" style="position:relative; top:2.5rem">
    <q-toolbar class="tbs">
      <btn-cond color="warning" icon="close" @ok="ko"/>
      <q-toolbar-title class="titre-lg">
        {{$t('PSm' + phase)}}
      </q-toolbar-title>
    </q-toolbar>

    <q-card-section class="fs-md">
      <div class="row justify-between items-center">
        <div class="row items-center q-gutter-sm">
          <q-checkbox v-model="vkb" color="warning" style="position:relative;left:-8px"/>
          <span class="text-primary fs-lg ">{{$t('PSkb')}}</span>
        </div>
        <div class="row items-center q-gutter-sm">
          <span class="titre-sm text-italic">{{$t('PSutpin')}}</span>
          <bouton-help page="page_login_pin"/>
        </div>
      </div>

      <div v-if="!orgext" class="q-my-md">
        <div class="titre-lg">{{$t('PSorg1')}}</div>
        <q-input v-model="orgL" dense class="ph"
          :hint="$t('PSorg2')" :placeholder="$t('PSorg3')"/>
      </div>

      <q-input v-if="!keyboard.v" dense counter
        :hint="ligne1.length < lgph ? $t('PSnbc', [lgph]) : $t('entree')" 
        v-model="ligne1" 
        @keydown.enter.prevent="ok2" 
        :type="isPwd ? 'password' : 'text'" :placeholder="$t('PSl1')">
        <template v-slot:append>
          <btn-cond :icon="isPwd ? 'visibility_off' : 'visibility'" round 
            color="none" @ok="isPwd = !isPwd"/>
          <btn-cond icon="cancel" round :disable="ligne1.length === 0"
            color="none" @ok="forceInput('')"/>
          <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
        </template>
      </q-input>
      <div v-else class="row items-center">
        <div class="col q-mr-sm font-mono text-bold fs-md height-2 bord">{{secligne1}}</div>
        <btn-cond class="col-auto" :icon="isPwd ? 'visibility_off' : 'visibility'" 
          color="none" round @ok="isPwd = !isPwd"/>
        <btn-cond icon="cancel" round color="none" 
          :disable="ligne1.length === 0" @ok="forceInput('')"/>
      </div>

      <div class="row justify-end items-center q-gutter-md">
        <btn-cond flat icon="undo" :label="labelRenoncer" @ok="ko"/>
        <btn-cond color="warning" :label="labelVal()" :icon="iconValider"
          :disable="!ligne1 || ligne1.length < 6 || !orgL"
          @ok="ok2" />
      </div>

      <div class="q-my-md">
      <div v-if="login && session.synchro" class="fs-md column justify-center q-px-sm">
        <q-checkbox v-if="$q.dark.isActive" v-model="razdb" dense size="xs" color="grey-8"
          class="bg1 text-italic text-grey-8 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
        <q-checkbox v-else v-model="razdb" dense size="xs" color="grey-5"
          class="bg1 text-italic text-grey-7 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
      </div>
      </div>
    
    </q-card-section>
  </q-card>
  <div class="simple-keyboard" style="position:relative; top:2.5rem; width:30rem;"></div>
</q-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'

import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'

import stores from '../stores/stores.mjs'

import { Phrase } from '../app/modele.mjs'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { $t, styp, afficherDiag, u8ToB64, b64ToU8 } from '../app/util.mjs'
import { pbkfd, crypter, decrypterStr } from '../app/webcrypto.mjs'

const encoder = new TextEncoder()

const lgph = 24
const layout = {
  default: [
    '` 1 2 3 4 5 6 7 8 9 0 \u00B0 + {bksp}',
    '{tab} a z e r t y u i o p ^ $',
    '{lock} q s d f g h j k l m \u00F9 * {enter}',
    '{shift} < w x c v b n , ; : ! {shift}',
    '.com @ {space}'
  ],
  shift: [
    "\u00B2 & \u00E9 \" ' ( - \u00E8 _ \u00E7 \u00E0 ) = {bksp}",
    '{tab} A Z E R T Y U I O P \u00A8 \u00A3',
    '{lock} Q S D F G H J K L M % \u00B5 {enter}',
    '{shift} > W X C V B N ? . / \u00A7 {shift}',
    '.com @ {space}'
  ]
}
const keyboard = { v: null }

const ui = stores.ui
const config = stores.config
const session = stores.session

const vkb = ref(false)

const iconValider = ref(ui.ps.iconValider || 'check')
const verif = ref(ui.ps.verif || false) // vérifier par double saisie
const labelValider = ref(ui.ps.labelValider || '')
const labelRenoncer = ref($t(ui.ps.labelRenoncer || 'renoncer'))
// Vient de login: proposer le raz de la base locale ET enregistrer org
const login = ref(ui.ps.login || false)
const orgext = ref(ui.ps.orgext || '') // le code de l'organisation a été saisi en dehors de ce dialogue
const initVal = ref(ui.ps.initVal || '') // valeur initiale de la phrase (SyncSp)

const orgL = ref()
const ligne1 = ref(initVal.value || '')
const phase = ref(0)
const razdb = ref(false)
const encours = ref(false)
const isPwd = ref(false)
const vligne1 = ref('')

if (orgext.value) { // PageAdmin SyncSp PageCompte
  if (orgext.value !== session.org) {
    /* l'organisation a été saisie préalablement: 
    - PageAdmin: juste avant dans le dialogue
    - SyncSp: saisie pour accéder à la phrase de sponsoring et au sponsoring
    */
    session.setOrg(orgext.value)
  }
  // Dans le cas de PageCompte, changement de PS, orgext EST déjà session.org
  orgL.value = orgext.value
} else { // PageLogin OutilsTests
  orgL.value = session.org || config.search || ''
}

onMounted(() => {
  ligne1.value = ''
  vkb.value = false
  if (keyboard.v) {
    keyboard.v.destroy()
    keyboard.v = null
  }
})

function onChange (input) {
  ligne1.value = input
}

function handleShift () {
  const currentLayout = keyboard.v.options.layoutName
  const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'
  keyboard.v.setOptions({
    layoutName: shiftToggle
  })
}

function onKeyPress (button) {
  if (button === '{shift}' || button === '{lock}') handleShift()
  if (button === '{enter}') {
    if (keyboard.v) keyboard.v.destroy()
    keyboard.v = null
  }
}

function setKB () {
  if (!vkb.value || keyboard.v) return
  keyboard.v = new Keyboard({
    onChange: input => onChange(input),
    onKeyPress: button => onKeyPress(button),
    layout: layout,
    theme: 'hg-theme-default'
  })
  const s = ligne1.value
  keyboard.v.setInput(s)
}

function forceInput (inp) {
  ligne1.value = inp
  if (keyboard.v) 
    keyboard.v.setInput(inp)
}

watch(vkb, (ap, av) => {
  if (!ap && keyboard.v) {
    keyboard.v.destroy()
    keyboard.v = null
  }
  if (ap) setKB()
})

const secligne1 = computed(() => isPwd.value ? ''.padStart(ligne1.value.length, '*') : ligne1.value)

/*
watch(ligne1, (ap) => {
  if (ap && ap.length > 4 && ap.endsWith('*')) {
    const c = ap.substring(0, ap.length - 1)
    let s = ''
    while (s.length < lgph) s += c
    forceInput(s)
  }
})
*/

watch(razdb, async (ap) => {
  if (ap === true) await afficherDiag($t('LOGrazbl'))
  ui.razdb = ap
})

function selph (p) { 
  forceInput(p)
}

function labelVal () {
  if (!verif.value) return $t(labelValider.value || 'PSval')
  return phase.value < 2 ? $t('ok') : $t((labelValider.value || 'PSval'))
}

async function ok2 () {
  await doPin()
  if (ligne1.value.length >= lgph) ok()
}

function ok () {
  if (!verif.value) {
    okem()
  } else {
    if (phase.value < 2) {
      vligne1.value = ligne1.value
      forceInput('')
      phase.value = 2
    } else {
      if (ligne1.value === vligne1.value) {
        okem()
      } else {
        raz()
        phase.value = 1
      }
    }
  }
}

function okem () {
  encours.value = true
  ui.fD()
  setTimeout(async () => {
    const pc = new Phrase()
    await pc.init(ligne1.value)
    // await sleep(5000)
    if (login.value) session.setOrg(orgL.value)
    // ui.ps.ok est la fonction de callback quand ok
    await ui.ps.ok(pc)
    raz()
  }, 300)
}

function ko () {
  raz()
  ui.fD()
  ui.ps.ok(null)
}

function raz () {
  encours.value = false
  ligne1.value = ''
  vligne1.value = ''
  phase.value = 0
}

// traite la ligne d'entrée comme un PIN
const doPin = async () => {
  const lg = ligne1.value
  if (!lg.startsWith('&')) return
  const i = lg.indexOf('&', 1)
  if (i < 4) return
  const pin = lg.substring(1, i)
  const ph = lg.substring(i + 1)
  if (ph.length > 0 && ph.length < lgph) {
    await afficherDiag($t('PScourte', [ph.length, lgph]))
    return
  }

  const lstk = '&&' + u8ToB64(await pbkfd(encoder.encode(pin + pin + pin)), true)
  const cle = await pbkfd(encoder.encode(pin + pin + pin + pin + pin))
  if (ph.length === 0) {
    const x = localStorage.getItem(lstk)
    if (!x) {
      await afficherDiag($t('PSnopin', [pin]))
      return
    }
    let v
    try {
      v = await decrypterStr(cle, b64ToU8(x))
    } catch (e) {}
    if (!v) {
      await afficherDiag($t('PSkopin'))
      return
    }
    ligne1.value = v
  } else {
    const x = u8ToB64(await crypter(cle, encoder.encode(ph)), true)
    localStorage.setItem(lstk, x)
    ligne1.value = ph
  }
}

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.t1
  font-size: 1.1rem
  font-weight: bold
  font-style: italic
  color: var(--q-primary)
.q-card__section
  padding: 0.3rem
.hg-theme-default
  color: black !important
  font-family:'Ubuntu Mono'
.ph
  width: 20rem
.bord
  border: 1px solid $yellow-5
</style>
