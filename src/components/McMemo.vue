<template>
  <div ref="root">
    <div :class="dkli(idx)">
      <div v-if="large" class="row full-width items-center">
        <div class="col-6 text-italic fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else>{{$t('MMCnomemo')}}</span>
        </div>
        <div class="col">
          <div v-if="apropos.ht.size" class="row q-gutter-xs fs-sm font-mono z1 items-center">
            <div class="text-warning text-bold q-mr-xs">{{apropos.ht.size}}</div>
            <div v-for="mc in apropos.ht.size" :key="mc" class="bg-yellow-2 text-bold text-black">
              {{mc}}
            </div>
          </div>
          <div v-else class="text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
        </div>
        <q-btn class="col-auto text-right" size="md" color="primary" padding="none" round
          icon="edit" @click="zoom"/>
      </div>

      <div v-else class="column full-width">
        <div class="text-italic fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else>{{$t('MMCnomemo')}}</span>
        </div>
        <div class="row items-center">
          <div v-if="apropos.ht.size" class="col row q-gutter-xs fs-sm font-mono z1">
            <div class="text-warning text-bold q-mr-xs">{{apropos.ht.size}}</div>
            <div v-for="ht in ht" :key="ht" 
              class="bg-yellow-2 text-bold text-black">
              {{ht}}
            </div>
          </div>
          <div v-else class="col text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
          <q-btn class="col-auto text-right" size="md" color="primary" padding="none" round
            icon="edit" @click="zoom"/>
        </div>
      </div>
    </div>

    <q-dialog v-model="ui.d.MMedition[idc]">
      <q-card :class="styp('md')">
        <q-toolbar class="col-auto bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="ui.fD"/>
          <q-toolbar-title>{{$t('MMCap', [nom])}}</q-toolbar-title>
        </q-toolbar>
        <q-toolbar inset v-if="diag" class='q-ma-sm bg-yellow-5 text-warning text-bold'>
          {{$t('MMCnomaj', [diag])}}
        </q-toolbar>

        <q-card-section class="q-py-sm">
          <div class="titre-lg text-italic">{{$t('MMCmc')}}</div>
          <div>{{hashtags.join(' / ')}}</div>
        </q-card-section>

        <q-card-section class="q-py-sm">
          <div class="titre-md">{{$t('MMCcom')}}</div>
          <editeur-md mh="10rem" v-model="txt" :texte="apropos.texte" :idx="0"
           :editable="!diag" modetxt/>
        </q-card-section>

        <q-card-actions v-if="!diag" align="right" class="q-gutter-sm">
          <q-btn flat dense padding="xs" color="primary" size="md" icon="undo" 
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn class="q-ml-md" dense padding="xs" color="primary" size="md" icon="check" 
            :label="$t('valider')" @click="valider"/>
        </q-card-actions>

      </q-card>
    </q-dialog>
  </div>
</template>
<script>

import { ref, onMounted } from 'vue'

import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import { styp, dkli, titre } from '../app/util.mjs'
import { McMemo } from '../app/operations.mjs'

const LARGE = 500

export default {
  name: 'McMemo',

  props: { id: Number, idx: Number },

  components: { EditeurMd },

  computed: { 
    apropos () { return this.session.compti.get(this.id) },
    memolg () { return titre(this.apropos.texte) },
    nom () { return this.pSt.getCV(this.id).nom }
  },

  data () { return {
    diag: '',
    nvmc: null,
    txt: '',
  }},

  watch: {
    "$q.screen.width"() {
      const l = this.root.offsetWidth > LARGE
      if (l !== this.large) this.large = l
    }
  },

  methods: {
    async zoom () { 
      this.diag = await this.session.editDiag
      this.nvmc = null
      this.txt = this.memo
      this.ui.oD('MMedition', this.idc)
    },
    changerMc (nvmc) {
      this.nvmc = nvmc
    },
    async valider () {
      // console.log(this.txt)
      // console.log(Motscles.editU8(this.nvmc, this.mapmc))
      await new McMemo().run(this.id, this.nvmc || this.mc, this.txt)
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
</style>
