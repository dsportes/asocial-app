<template>
<div>
  <div :class="'row justify-between ' + dkli(idx)">
    <div v-if="!src.length" class="titre-md text-italic">{{$t('MCaucun')}}</div>
    <div v-else class="col row font-mono fs-sm">
      <div class="titre-md text-bold q-mr-sm">{{src.length ? $t('MCmc') : $t('MCaucun')}}</div>
      <span v-for="idx in src" :key="idx" 
        :class="sty(idx) + ' cmc q-mr-sm'">{{nom(idx)}}</span>
    </div>
    <q-btn v-if="edit" class="col-auto btn1" size="sm" icon="edit" color="warning" @click="editer">
      <q-tooltip class="bg-white text-primary">{{$t('editer')}}</q-tooltip>
    </q-btn>
  </div>
  <q-dialog v-model="mcedit" persistent>
    <choix-motscles :src="src" :du-groupe="duGroupe" :du-compte="duCompte"
      :titre="$t('MCchoix')" @ok="okmc"/>
  </q-dialog>
</div>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ChoixMotscles from './ChoixMotscles.vue'

export default ({
  name: 'ApercuMotscles',

  props: { mapmc: Object, src: Object, edit: Boolean, idx: Number, duCompte: Boolean, duGroupe: Number },

  components: { ChoixMotscles },

  computed: {
  },

  data () { return {
    mcedit: false
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (! await this.session.edit()) return
      if (this.edit) this.mcedit = true
    },
    okmc (mc) { 
      if (mc) this.$emit('ok', mc)
      this.mcedit = false
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
      if (!mapMC.value) return ''
      const e = mapMC.value.get(''+idx)
      return e && e.n ? e.n : ''
    }
    
    return {
      session,
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
