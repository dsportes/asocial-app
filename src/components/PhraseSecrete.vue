<template>
  <q-card-section class="fs-md">
    <q-checkbox v-model="vkb" color="primary" style="position:relative;left:-8px"/>
    <span class="cprim fs-lg">{{$t('PSkb')}}</span>

    <div v-if="!orgext" class="q-my-md row items-center">
      <div class="column">
        <div class="titre-lg q-mr-md">{{$t('PSorg1')}}</div>
        <q-checkbox v-if="session.accesIdb" v-model="memoOrgL" dense size="sm" 
          :label="$t('PSmemo')"/>
      </div>
      <q-input v-model="orgL" dense style="width:20rem" class="ph"
        :hint="$t('PSorg2')" :placeholder="$t('PSorg3')"/>
    </div>

    <div class="titre-lg">{{$t('PSm'+phase)}}</div>

    <q-input dense counter
      :hint="ligne1.length < lgph ? $t('PSnbc', [lgph]) : $t('NPpe')" 
      v-model="ligne1" @focus="setKB(1)" 
      @keydown.enter.prevent="ok2" 
      :type="isPwd ? 'password' : 'text'" :placeholder="$t('PSl1')">
      <template v-slot:append>
        <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
        <q-btn icon="cancel" size="md" :disable="ligne1.length === 0"  @click="ligne1 = ''"/>
        <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
      </template>
    </q-input>
    <div class="row justify-between items-center">
      <div v-if="isDev" class="row">
        <span class="text-primary cursor-pointer q-px-xs" v-for="(p, idx) in config.phrases" 
          :key="idx" @click="selph(p)">{{idx}}</span>
      </div>
      <div v-else></div>
      <div>
        <q-btn class="q-mr-sm" color="primary" flat :label="$t('PSren')" 
          size="md" @click="ko" padding="xs md"/>
        <q-btn color="warning" :label="labelVal()" size="md" :icon-right="iconValider"
          padding="xs md" :disable="!ligne1 || ligne1.length < lgph" @click="ok" />
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
import { $t, sleep } from '../app/util.mjs'

export default ({
  name: 'PhraseSecrete',
  props: { 
    iconValider: String,
    verif: Boolean,
    labelValider: String,
    initVal: Object, 
    nbc: Number,
    orgext: String
  },
  data () {
    return {
      phase: 0,
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
        for (let i = 0; i < (this.lgph / 2); i++) s += c
        this.ligne1 = s
      }
    }
  },
  methods: {
    selph (p) {
      this.ligne1 = p
    },
    labelVal () {
      if (!this.verif) return $t(this.labelValider || 'PSval')
      return this.phase < 2 ? $t('OK') : $t((this.labelValider || 'PSval'))
    },
    ok2 () {
      if (this.ligne1.length >= this.lgph) this.ok()
    },
    ok () {
      if (!this.verif) {
        this.okem()
      } else {
        if (this.phase < 2) {
          this.vligne1 = this.ligne1
          this.ligne1 = ''
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
      setTimeout(async () => {
        const pc = new Phrase()
        await pc.init(this.ligne1, this.orgext || this.session.org)
        pc.phrase = null
        // await sleep(5000)
        this.$emit('ok', pc)
        this.raz()
      }, 300)
    },
    ko () {
      this.raz()
      this.$emit('ok', null)
    },
    raz () {
      this.encours = false
      this.ligne1 = ''
      this.vligne1 = ''
      this.phase = 0
    }
  },

  setup (props) {
    const config = stores.config
    const session = stores.session
    const isDev = config.DEV
    const initVal = toRef(props, 'initVal')
    const ligne1 = ref('')
    const nbc = toRef(props, 'nbc')
    const lgph = ref(nbc.value || 24)
    const orgext = toRef(props, 'orgext')
    session.setOrg(orgext.value || session.presetOrg)
    
    const orgL = ref(session.org)
    const memoOrgL = ref(session.memoOrg)

    watch(() => memoOrgL.value, (ap, av) => {
        session.setMemoOrg(ap)
        if (ap) {
          session.setOrg(orgL.value)
        } else {
          session.resetOrg()
          orgL.value = ''
        }
      }
    )

    watch(() => orgL.value, (ap, av) => {
      if (ap) session.setOrg(ap); else session.resetOrg()
    })

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
      nl.value = 0
      vkb.value = false
      if (keyboard.value) {
        keyboard.value.destroy()
        keyboard.value = null
      }
    })

    function onChange (input) {
      if (nl.value === 1) ligne1.value = input
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
      config, session,
      orgL,
      memoOrgL,
      isDev: isDev,
      keyboard,
      setKB,
      ligne1,
      vkb,
      lgph
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
