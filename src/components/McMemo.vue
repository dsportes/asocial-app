<template>
  <div>
    <div :class="dkli(idx) + ' row justify-between'">
      <div class="column">
        <div v-if="memolg">
          <span class="q-mr-xs text-italic">{{$t('MMCcom')}}</span>
          <span>{{memolg}}</span>
        </div>
        <div v-else class="q-mr-xs text-italic">{{$t('MMCnomemo')}}</div>
        <div v-if="mclg">
          <span class="q-mr-xs text-italic">{{$t('MMCmc')}}</span>
          <span>{{mclg}}</span>
        </div>
        <div v-else class="q-mr-xs text-italic">{{$t('MMCnomc')}}</div>
      </div>
      <q-btn class="q-ml-sm btn" size="sm" color="primary" icon="edit" @click="zoom"/>
    </div>

    <q-dialog v-model="edition">
      <q-card class="bs moyennelargeur column">
        <q-toolbar class="col-auto bg-primary text-white">
          <q-btn dense size="md" icon="close" @click="MD.fD"/>
          <q-toolbar-title>{{$t('MMCap', [nom])}}</q-toolbar-title>
        </q-toolbar>

        <div v-if='diag' class='q-ma-sm bg-yellow-5 text-warning text-bold'>
          {{$t('MMCnomaj', [diag])}}
        </div>

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
            @click="MD.fD"/>
          <q-btn class="q-ml-md" dense flat color="warning" size="md" icon="chek" 
            :label="$t('valider')" @click="valider"/>
        </q-card-actions>

      </q-card>
    </q-dialog>
  </div>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { Motscles, getNg, MD } from '../app/modele.mjs'
import ApercuMotscles from './ApercuMotscles.vue'
import EditeurMd from './EditeurMd.vue'
import { dkli, titre } from '../app/util.mjs'
import { McMemo } from '../app/operations.mjs'

export default {
  name: 'McMemo',

  props: { id: Number, idx: Number },

  components: { ApercuMotscles, EditeurMd },

  computed: { 
    nom () { return getNg(this.id).nom },
    mc () { return this.mcmemo && this.mcmemo.mc ? this.mcmemo.mc : new Uint8Array([])},
    mclg () { return this.mcmemo && this.mcmemo.mc ?
      Motscles.editU8(this.mcmemo.mc, this.mapmc) : ''
    },
    memo () { return this.mcmemo && this.mcmemo.memo ? this.mcmemo.memo : '' },
    memolg () { return titre(this.memo) },
  },

  data () { return {
    diag: '',
    nvmc: null,
    txt: '',
  }},

  methods: {
    async zoom () { 
      this.diag = await this.session.edit(true)
      this.nvmc = null
      this.txt = this.memo
      this.ovedition()
    },
    changerMc (nvmc) {
      this.nvmc = nvmc
    },
    async valider () {
      // console.log(this.txt)
      // console.log(Motscles.editU8(this.nvmc, this.mapmc))
      await new McMemo().run(this.id, this.nvmc || this.mc, this.txt)
      MD.fD()
    }
   },

  setup (props) {
    const session = stores.session
    const aSt = stores.avatar
    const id = toRef(props, 'id')
    const mapmc = ref(Motscles.mapMC(true, 0))

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

    const edition = ref(false)
    function ovedition () { MD.oD(edition) }

    return {
      session,
      mcmemo, dkli, MD, titre, mapmc, edition, ovedition
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  height: 1.1rem !important
  max-height: 1.1rem !important
</style>
