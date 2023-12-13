<template>
  <div ref="root">
    <div :class="dkli(idx)">
      <div v-if="large" class="row full-width">
        <div class="col-6 text-italic fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else>{{$t('MMCnomemo')}}</span>
        </div>
        <div class="col">
          <div v-if="mclg.length" class="row q-gutter-xs fs-sm font-mono z1">
            <div class="text-warning text-bold q-mr-xs">{{mclg.length}}</div>
            <div v-for="mc in mclg" :key="mc" 
              class="bg-yellow-2 text-bold text-black">
              {{mc}}
            </div>
          </div>
          <div v-else class="text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
        </div>
        <q-btn class="col-auto text-right btn" size="sm" color="primary" icon="edit" @click="zoom"/>
      </div>

      <div v-else class="column full-width">
        <div class="text-italic fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else>{{$t('MMCnomemo')}}</span>
        </div>
        <div class="row">
          <div v-if="mclg.length" class="col row q-gutter-xs fs-sm font-mono z1">
            <div class="text-warning text-bold q-mr-xs">{{mclg.length}}</div>
            <div v-for="mc in mclg" :key="mc" 
              class="bg-yellow-2 text-bold text-black">
              {{mc}}
            </div>
          </div>
          <div v-else class="col text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
          <q-btn class="col-auto text-right btn" size="sm" color="primary" icon="edit" @click="zoom"/>
        </div>
      </div>
    </div>

    <q-dialog v-model="ui.d.MMedition">
      <q-card class="bs dp40">
        <q-toolbar class="col-auto bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="ui.fD"/>
          <q-toolbar-title>{{$t('MMCap', [nom])}}</q-toolbar-title>
        </q-toolbar>
        <q-toolbar inset v-if="diag" class='q-ma-sm bg-yellow-5 text-warning text-bold'>
          {{$t('MMCnomaj', [diag])}}
        </q-toolbar>

        <q-card-section class="q-py-sm">
          <div class="titre-lg text-italic">{{$t('MMCmc')}}</div>
          <apercu-motscles @ok="changerMc" :idx="0" du-compte :du-groupe="0"
            :mapmc="mapmc" :edit="!diag" :src="nvmc || mc"/>
        </q-card-section>

        <q-card-section class="q-py-sm">
          <div class="titre-md">{{$t('MMCcom')}}</div>
          <editeur-md mh="10rem" v-model="txt" :texte="memo" :idx="0"
           :editable="!diag" modetxt/>
        </q-card-section>

        <q-card-actions v-if="!diag">
          <q-btn dense flat color="primary" size="md" icon="close" :label="$t('renoncer')" 
            @click="ui.fD"/>
          <q-btn class="q-ml-md" dense flat color="warning" size="md" icon="chek" 
            :label="$t('valider')" @click="valider"/>
        </q-card-actions>

      </q-card>
    </q-dialog>
  </div>
</template>
<script>

import { toRef, ref, watch, onMounted } from 'vue'

import stores from '../stores/stores.mjs'
import { Motscles, getNg } from '../app/modele.mjs'
import ApercuMotscles from './ApercuMotscles.vue'
import EditeurMd from './EditeurMd.vue'
import { dkli, titre } from '../app/util.mjs'
import { McMemo } from '../app/operations.mjs'

const LARGE = 500

export default {
  name: 'McMemo',

  props: { id: Number, idx: Number },

  components: { ApercuMotscles, EditeurMd },

  computed: { 
    nom () { return getNg(this.id).nom },
    mc () { return this.mcmemo && this.mcmemo.mc ? this.mcmemo.mc : new Uint8Array([])},
    mclg () { return this.mcmemo && this.mcmemo.mc ?
      Motscles.editU8(this.mcmemo.mc, this.mapmc) : []
    },
    memo () { return this.mcmemo && this.mcmemo.memo ? this.mcmemo.memo : '' },
    memolg () { return titre(this.memo) },
  },

  data () { return {
    diag: '',
    nvmc: null,
    txt: '',
  }},

  watch: {
    "$q.screen.width"() {
      const l = this.root.offsetWidth > LARGE
      if (l !== this.large) {
        this.large = l
        // console.log(this.large)
      }
    }
  },

  methods: {
    async zoom () { 
      this.diag = await this.session.editDiag
      this.nvmc = null
      this.txt = this.memo
      this.ui.oD('MMedition')
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
    const id = toRef(props, 'id')
    const mapmc = ref(Motscles.mapMC(true, 0))
    const root = ref(null)
    const large = ref(false)

    const mcmemo = ref(null)
    
    function getmm () {
      mcmemo.value = aSt.compte.mcmemo(id.value)
    }

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => id.value, (ap, av) => {
        getmm()
      }
    )

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' && args[0].id === session.compteId) {
          getmm()
        }
      })
    })

    getmm()

    onMounted(() => {
      large.value = root.value.offsetWidth > LARGE
      // console.log(large.value)
    })

    return {
      session, ui, root, large,
      mcmemo, dkli, titre, mapmc
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
