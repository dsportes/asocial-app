<template>
<div>
  <div :class="'row justify-between ' + dkli(idx)">
    <div v-if="!src.length" class="text-italic">{{$t('MCaucun')}}</div>
    <div v-else class="col row font-mono fs-sm">
      <div class="text-bold q-mr-sm">{{src.length ? $t('MCmc') : $t('MCaucun')}}</div>
      <span v-for="n in src" :key="n" 
        :class="sty(n) + ' q-mr-xs q-px-xs bg-secondary text-white'">{{nom(n)}}</span>
    </div>
    <q-btn v-if="edit" class="col-auto" 
      size="md" padding="none" round icon="edit" color="warning" 
      @click="editer">
      <q-tooltip class="bg-white text-primary">{{$t('editer')}}</q-tooltip>
    </q-btn>
    <q-btn v-if="!edit && !nozoom" class="col-auto" 
      size="md" padding="none" round icon="zoom_in" color="primary" 
      @click="editer">
      <q-tooltip class="bg-white text-primary">{{$t('zoomer')}}</q-tooltip>
    </q-btn>
  </div>

  <q-dialog v-model="ui.d.AMmcedit[idc]" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <q-btn class="q-mr-xs" size="md" dense color="warning" icon="close" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center">{{$t('MCtit')}}</q-toolbar-title>
      </q-toolbar>
      <q-toolbar v-if="diag" inset class="bg-yellow-5 text-black text-bold fs-md">{{diag}}</q-toolbar>

      <div class="q-pa-sm">
        <choix-motscles :du-groupe="duGroupe" :du-compte="duCompte"
          :init-value="src || mcvide" :editable="edit"
          :titre="$t('MCchoix')" :ok="okmc"/>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ChoixMotscles from './ChoixMotscles.vue'
import { dkli, styp } from '../app/util.mjs'

export default ({
  name: 'ApercuMotscles',

  props: { 
    mapmc: Object, 
    src: Object, 
    edit: Boolean,
    nozoom: Boolean,
    idx: Number, 
    duCompte: Boolean, 
    duGroupe: Number,
    ok: Function
  },

  components: { ChoixMotscles },

  computed: {
  },

  data () { return {
  }},

  methods: {
    async editer () {
      this.ui.oD('AMmcedit', this.idc)
    },
    okmc (mc) { 
      this.ui.fD()
      if (this.ok) this.ok(mc)
    },
    sty (idx) {
      if (idx < 100) return ''
      return idx <= 199 ? 'text-italic' : 'text-bold'
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const mapMC = toRef(props, 'mapmc')
    const diag = ref(session.editDiag)

    function nom (idx) {
      if (!mapMC.value) return '' + idx
      const e = mapMC.value.get(''+idx)
      return e && e.n ? e.n : ('' + idx)
    }

    return {
      dkli, styp, idc, diag,
      session, ui,
      mcvide: new Uint8Array([]),
      nom
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.cmc
  border-radius: 3px
  border: 1px solid $warning
  padding: 0
  height: 1.2rem
</style>
