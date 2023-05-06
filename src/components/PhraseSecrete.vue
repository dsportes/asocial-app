<template>
  <q-card-section class="fs-md">
    <q-checkbox v-model="vkb" color="primary" style="position:relative;left:-8px"/>
    <span class="cprim fs-lg">{{$t('PSkb')}}</span>
    <div class="titre-lg">{{$t('PSm'+phase)}}</div>
    <q-input dense counter :hint="$t('PS16c')" v-model="ligne1" @focus="setKB(1)" :type="isPwd ? 'password' : 'text'" :label="$t('PSl1')">
    <template v-slot:append>
        <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
        <span :class="!ligne1 || ligne1.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="ligne1 = ''"/></span>
    </template>
    </q-input>
    <q-input dense counter :hint="$t('PS16c')" v-model="ligne2" @focus="setKB(2)" :type="isPwd ? 'password' : 'text'" :label="$t('PSl2')">
    <template v-slot:append>
        <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
        <span :class="!ligne2 || ligne2.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer" @click="ligne2 = ''"/></span>
    </template>
    </q-input>
    <div>
      <div v-if="encours" class="t1">{{$t('cryptage')}}
        <q-spinner color="primary" size="2rem" :thickness="3" />
      </div>
      <div v-else class="row justify-between items-center no-wrap">
        <div v-if="isDev">
          <span class="text-primary cursor-pointer q-px-xs" v-for="(p, idx) in config.phrases" :key="idx" @click="selph(p)">{{idx}}</span>
        </div>
        <div>
          <q-btn class="q-mr-sm" color="primary" flat :label="$t('PSren')" size="md" @click="ko" />
          <q-btn color="warning" glossy :label="labelVal()" size="md" :icon-right="iconValider"
            :disable="!ligne1 || !ligne2 || ligne1.length < 16 || ligne2.length < 16" @click="ok" />
        </div>
      </div>
    </div>
    <div class="simple-keyboard"></div>
  </q-card-section>
</template>
<script>
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import { toRef, ref, watch, onMounted } from 'vue'

import stores from '../stores/stores.mjs'

import { Phrase } from '../app/modele.mjs'
import { $t } from '../app/util.mjs'

export default ({
  name: 'PhraseSecrete',
  props: { iconValider: String, verif: Boolean, labelValider: String, initVal: Object },
  data () {
    return {
      phase: 0,
      encours: false,
      isPwd: false,
      vligne1: '',
      vligne2: ''
    }
  },
  watch: {
    ligne1 (ap) {
      if (ap && ap.length === 2) {
        if (ap.charAt(0) === '*') {
          const c = ap.charAt(1)
          let s = ''
          for (let i = 0; i < 16; i++) s += c
          this.ligne1 = s
          this.ligne2 = s
        }
      } else if (ap && ap.length === 3 && ap.startsWith('!')) {
        const c = ap.substring(1, 3)
        let s = ''
        for (let i = 0; i < 8; i++) s += c
        this.ligne1 = s
        this.ligne2 = s
      }
    }
  },
  methods: {
    selph (p) {
      this.ligne1 = p[0]
      this.ligne2 = p[1]
    },
    labelVal () {
      if (!this.verif) return $t(this.labelValider || 'PSval')
      return this.phase < 2 ? $t('OK') : $t((this.labelValider || 'PSval'))
    },
    ok () {
      if (!this.verif) {
        this.okem()
      } else {
        if (this.phase < 2) {
          this.vligne1 = this.ligne1
          this.vligne2 = this.ligne2
          this.ligne1 = ''
          this.ligne2 = ''
          this.phase = 2
        } else {
          if (this.ligne1 === this.vligne1 && this.ligne2 === this.vligne2) {
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
      setTimeout(async () => {
        const ps = new Phrase()
        await ps.init(this.ligne1, this.ligne2)
        this.$emit('ok-ps', ps)
        this.raz()
      }, 300)
    },
    ko () {
      this.raz()
      this.$emit('ok-ps', null)
    },
    raz () {
      this.encours = false
      this.ligne1 = ''
      this.ligne2 = ''
      this.vligne1 = ''
      this.vligne2 = ''
      this.phase = 0
    }
  },

  setup (props) {
    const config = stores.config
    const isDev = config.dev
    const initVal = toRef(props, 'initVal')
    const ligne1 = ref('')
    const ligne2 = ref('')

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

    const keyboard = ref(null)
    const nl = ref(0)
    const vkb = ref(false)

    onMounted(() => {
      ligne1.value = initVal.value ? initVal.value.debut : ''
      ligne2.value = initVal.value ? initVal.value.fin : ''
      nl.value = 0
      vkb.value = false
      if (keyboard.value) {
        keyboard.value.destroy()
        keyboard.value = null
      }
    })

    function onChange (input) {
      if (nl.value === 1) ligne1.value = input
      if (nl.value === 2) ligne2.value = input
    }

    function handleShift () {
      const currentLayout = keyboard.value.options.layoutName
      const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'
      keyboard.value.setOptions({
        layoutName: shiftToggle
      })
    }

    function onKeyPress (button) {
      if (button === '{shift}' || button === '{lock}') handleShift()
      if (button === '{enter}') {
        keyboard.value.destroy()
        nl.value = 0
      }
    }

    function setKB (n) {
      if (!vkb.value) return
      if (!nl.value) {
        keyboard.value = new Keyboard({
          onChange: input => onChange(input),
          onKeyPress: button => onKeyPress(button),
          layout: layout,
          theme: 'hg-theme-default'
        })
      }
      if (nl.value !== n) {
        if (n === 1) keyboard.value.setInput(ligne1.value)
        if (n === 2) keyboard.value.setInput(ligne2.value)
      }
      nl.value = n
    }

    watch(() => vkb.value, (ap, av) => {
      if (!ap && keyboard.value) {
        keyboard.value.destroy()
        nl.value = 0
      }
    })

    return {
      config,
      isDev: isDev,
      keyboard,
      setKB,
      ligne1,
      ligne2,
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
</style>
