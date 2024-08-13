<template>
  <div>
    <div ref="root" :class="dkli(idx + 1) + ' mcm'">
      <div v-if="large" class="row full-width items-center">
        <div class="col-6 fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else class="text-italic">{{$t('MMCnomemo')}}</span>
        </div>
        <div class="col">
          <div v-if="apropos.ht.size" class="font-mono fs-sm z1">{{s2Str(apropos.ht)}}</div>
          <div v-else class="text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
        </div>
        <btn-cond class="col-auto text-right" round icon="zoom_in" @ok="zoom"/>
      </div>

      <div v-else class="column full-width">
        <div class="text-italic fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else class="text-italic">{{$t('MMCnomemo')}}</span>
        </div>
        <div class="row items-center">
          <div v-if="apropos.ht.size" class="font-mono fs-md z1">{{s2Str(apropos.ht)}}</div>
          <div v-else class="text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
          <btn-cond class="col-auto text-right" round icon="zoom_in" @ok="zoom"/>
        </div>
      </div>
    </div>

    <q-dialog v-model="ui.d.MMedition[idc]">
      <q-card :class="styp('sm')">
        <q-toolbar class="col-auto bg-secondary text-white">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
          <q-toolbar-title>{{$t('MMCap', [nom])}}</q-toolbar-title>
        </q-toolbar>
        <q-toolbar inset v-if="diag" class='q-ma-sm bg-yellow-5 text-warning text-bold'>
          {{$t('MMCnomaj', [diag])}}
        </q-toolbar>

        <q-card-section class="q-py-sm">
          <hash-tags v-model="nvht" :src="apropos.ht"/>
        </q-card-section>

        <q-card-section class="q-py-sm">
          <div class="titre-md">{{$t('MMCcom')}}</div>
          <editeur-md mh="10rem" v-model="nvtx" :texte="apropos.tx" :idx="0"
           :editable="!diag" modetxt/>
        </q-card-section>

        <q-card-actions v-if="!diag" align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond class="q-ml-md" icon="check" cond="cEdit" :disable="!chg"
            :label="$t('valider')" @ok="valider"/>
        </q-card-actions>

      </q-card>
    </q-dialog>
  </div>
</template>
<script>

import { ref, onMounted } from 'vue'

import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import BtnCond from './BtnCond.vue'
import HashTags from './HashTags.vue'
import { styp, dkli, titre } from '../app/util.mjs'
import { McMemo } from '../app/operations4.mjs'

const LARGE = 380

export default {
  name: 'McMemo',

  props: { id: String, idx: Number },

  components: { EditeurMd, HashTags, BtnCond },

  computed: { 
    apropos () { 
      const e = this.session.compti.mc.get(this.id) 
      return e || { ht: new Set(), tx: ''} 
    },
    memolg () { return titre(this.apropos.tx) },
    nom () { return this.session.getCV(this.id).nom },
    chg () { return this.apropos.tx !== this.nvtx || 
      this.s2Str(this.apropos.ht) !== this.s2Str(this.nvht) }
  },

  data () { return {
    diag: '',
    nvht: null,
    nvtx: ''
  }},

  watch: {
    "$q.screen.width"() {
      const l = this.root.offsetWidth > LARGE
      if (l !== this.large) this.large = l
    }
  },

  methods: {
    s2Str (s) { return Array.from(s).sort().join(' ')},

    zoom () { 
      this.diag = this.session.cEdit
      this.nvht = this.apropos.ht || new Set()
      this.nvtx = this.apropos.tx || ''
      this.ui.oD('MMedition', this.idc)
    },

    async valider () {
      await new McMemo().run(this.id, this.s2Str(this.nvht), this.nvtx)
      this.ui.fD()
    }
   },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const idc = ref(ui.getIdc())

    const root = ref(null)
    const large = ref(false)

    onMounted(() => {
      large.value = root.value.offsetWidth > LARGE
    })

    return {
      session, ui, idc, aSt, 
      root, large,
      dkli, styp,
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  min-height: 1.1rem !important
  max-height: 1.1rem !important
  min-width: 1.1rem !important
  max-width: 1.1rem !important
.z1
  max-height: 1.2rem
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
.mcm
  border-radius: 10px
  padding: 0 0 0 5px
  margin: 2px 0
</style>
