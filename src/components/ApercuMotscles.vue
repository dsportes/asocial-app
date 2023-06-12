<template>
<div>
  <div :class="'row justify-between ' + dkli(idx)">
    <div v-if="!src.length" class="text-italic">{{$t('MCaucun')}}</div>
    <div v-else class="col row font-mono fs-sm">
      <div class="text-bold q-mr-sm">{{src.length ? $t('MCmc') : $t('MCaucun')}}</div>
      <span v-for="n in src" :key="n" 
        :class="sty(n) + ' q-mr-xs q-px-xs bg-secondary text-white'">{{nom(n)}}</span>
    </div>
    <q-btn v-if="edit" class="col-auto btn1" size="sm" icon="edit" color="warning" @click="editer">
      <q-tooltip class="bg-white text-primary">{{$t('editer')}}</q-tooltip>
    </q-btn>
  </div>
  <q-dialog v-model="mcedit" persistent>
    <choix-motscles :du-groupe="duGroupe" :du-compte="duCompte"
      :init-value="src || mcvide" editable
      :titre="$t('MCchoix')" :ok-label="$t('ok')" @ok="okmc"/>
  </q-dialog>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ChoixMotscles from './ChoixMotscles.vue'
import { MD } from '../app/modele.mjs'

export default ({
  name: 'ApercuMotscles',

  props: { 
    mapmc: Object, 
    src: Object, 
    edit: Boolean, 
    idx: Number, 
    duCompte: Boolean, 
    duGroupe: Number
  },

  components: { ChoixMotscles },

  computed: {
  },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (! await this.session.edit()) return
      if (this.edit) this.ovmcedit()
    },
    okmc (mc) { 
      if (mc) this.$emit('ok', mc)
      MD.fD()
    },
    sty (idx) {
      if (idx < 100) return ''
      return idx <= 199 ? 'text-italic' : 'text-bold'
    }
  },

  setup (props) {
    const session = stores.session
    const mapMC = toRef(props, 'mapmc')

    function nom (idx) {
      if (!mapMC.value) return '' + idx
      const e = mapMC.value.get(''+idx)
      return e && e.n ? e.n : ('' + idx)
    }
    
    const mcedit = ref(false)
    function ovmcedit () { MD.oD(mcedit) }

    return {
      MD, mcedit, ovmcedit,
      session,
      mcvide: new Uint8Array([]),
      nom
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  padding: 0 !important
  width: 1.5rem !important
.cmc
  border-radius: 3px
  border: 1px solid $warning
  padding: 0
  height: 1.2rem
</style>
