<template>
<q-dialog v-model="ui.d.a.phrasesecrete" persistent position="top"
  transition-show="slide-down" transition-hide="fade">
  <q-card :class="styp('sm')" style="position:relative; top:2.5rem">
    <q-toolbar class="bg-secondary text-white">
      <btn-cond color="warning" icon="close" @ok="ko"/>
      <q-toolbar-title class="titre-lg">
        {{$t('PSm' + phase)}}
      </q-toolbar-title>
    </q-toolbar>

    <q-card-section class="fs-md">
      <q-checkbox v-model="vkb" color="primary" style="position:relative;left:-8px"/>
      <span class="cprim fs-lg">{{$t('PSkb')}}</span>

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

      <div class="row justify-between items-center q-my-md">
        <div v-if="config.phrases" class="row">
          <span class="text-primary cursor-pointer q-px-xs" v-for="(p, idx) in config.phrases" 
            :key="idx" @click="selph(p)">{{idx}}</span>
        </div>
        <div v-else></div>
        <div>
          <btn-cond class="q-mr-sm" flat :label="$t('renoncer')" @ok="ko"/>
          <btn-cond color="warning" :label="labelVal()" :icon-right="iconValider"
            :disable="!ligne1 || ligne1.length < lgph || !orgL"
            @ok="ok" />
        </div>
      </div>

      <div v-if="login && session.synchro" class="fs-md column justify-center q-px-sm">
        <q-checkbox v-if="$q.dark.isActive" v-model="razdb" dense size="xs" color="grey-8"
          class="bg1 text-italic text-grey-8 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
        <q-checkbox v-else v-model="razdb" dense size="xs" color="grey-5"
          class="bg1 text-italic text-grey-7 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
      </div>
    
    </q-card-section>
  </q-card>
  <div class="simple-keyboard" style="position:relative; top:2.5rem; width:30rem;"></div>
</q-dialog>
</template>

<script>
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import { ref, watch, onMounted } from 'vue'

import stores from '../stores/stores.mjs'

import { Phrase } from '../app/modele.mjs'
import BtnCond from '../components/BtnCond.vue'
import { $t, styp, afficherDiag } from '../app/util.mjs'

const lgph = 24

export default ({
  name: 'PhraseSecrete',

  props: {
  },
  
  components: { BtnCond },

  computed: {
    secligne1 () { return this.isPwd ? ''.padStart(this.ligne1.length, '*') : this.ligne1 }
  },

  data () {
    return {
      phase: 0,
      razdb: false,
      encours: false,
      isPwd: false,
      vligne1: ''
    }
  },

  watch: {
    ligne1 (ap) {
      if (ap && ap.length === 3 && ap.startsWith('*')) {
        const c = ap.substring(1, 3)
        let s = ''
        for (let i = 0; i < (lgph / 2); i++) s += c
        this.forceInput(s)
      }
    },
    async razdb (ap) {
      if (ap === true) await afficherDiag($t('LOGrazbl'))
      this.ui.razdb = ap
    }
  },

  methods: {
    selph (p) {
      this.forceInput(p)
    },
    labelVal () {
      if (!this.verif) return $t(this.labelValider || 'PSval')
      return this.phase < 2 ? $t('ok') : $t((this.labelValider || 'PSval'))
    },
    ok2 () {
      if (this.ligne1.length >= lgph) this.ok()
    },
    ok () {
      if (!this.verif) {
        this.okem()
      } else {
        if (this.phase < 2) {
          this.vligne1 = this.ligne1
          this.forceInput('')
          this.phase = 2
        } else {
          if (this.ligne1 === this.vligne1) {
            this.okem()
          } else {
            this.raz()
            this.phase = 1
          }
        }
      }
    },
    okem () {
      this.encours = true
      this.ui.fD()
      setTimeout(async () => {
        const pc = new Phrase()
        await pc.init(this.ligne1)
        // await sleep(5000)
        if (this.login) this.session.setOrg(this.orgL)
        await this.ui.ps.ok(pc)
        this.raz()
      }, 300)
    },
    ko () {
      this.raz()
      this.ui.fD()
      this.ui.ps.ok(null)
    },
    raz () {
      this.encours = false
      this.ligne1 = ''
      this.vligne1 = ''
      this.phase = 0
    }
  },

  setup () {
    const ui = stores.ui

    const config = stores.config
    const session = stores.session

    const iconValider = ref(ui.ps.iconValider || 'check')
    const verif = ref(ui.ps.verif || false) // vérifier par double saisie
    const labelValider = ref(ui.ps.labelValider || '')
    // Vient de login: proposer le raz de la base locale ET enregistrer org
    const login = ref(ui.ps.login || false)
    const orgext = ref(ui.ps.orgext || '') // le code de l'organisation a été saisi en dehors de ce dialogue
    const initVal = ref(ui.ps.initVal || '') // valeur initiale de la phrase (SyncSp)

    const orgL = ref()
    const ligne1 = ref('')

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

    if (initVal.value) ligne1.value = initVal.value

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
    const vkb = ref(false)

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
      // console.log(ligne1.value)
    }

    function handleShift () {
      const currentLayout = keyboard.value.options.layoutName
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

    watch(() => vkb.value, (ap, av) => {
      if (!ap && keyboard.v) {
        keyboard.v.destroy()
        keyboard.v = null
      }
      if (ap) setKB()
    })

    return {
      ui, config, session, styp,
      iconValider, labelValider, orgext, login, verif,
      orgL, ligne1, lgph,
      setKB, keyboard,
      forceInput,
      vkb
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.t1
  font-size: 1.1rem
  font-weight: bold
  font-style: italic
  color: $primary
.q-card__section
  padding: 0.3rem
.cprim
  color: $primary
.hg-theme-default
  color: black !important
  font-family:'Roboto Mono'
.ph
  width: 20rem
.bord
  border: 1px solid $yellow-5
</style>
