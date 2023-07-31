<template>
<div :class="'full-width ' + sty" :style="'height:' + henrem + 'rem;'">
  <div class="q-mb-sm">
    <div v-if="!ligne.id" class="titre-lg text-italic text-bold">
      {{$t('DTtit1')}}
    </div>
    <div v-else>
      <span class="titre-lg text-italic text-bold">
        <span v-if="pow===4">{{$t('DTtit4', [ID.court(ligne.id)])}}</span>
        <span v-else>{{$t('DTtit0', [ID.court(ligne.id), infoC || ''])}}</span>
      </span>
      <q-btn v-if="pow === 2" class="fs-md q-ml-md btn2" size="sm" dense
        color="primary" :icon="ligne.info ? 'edit' : 'add'" 
        :label="$t('info')" @click="editer"/>
    </div>
  </div>

  <div :style="'height:' + (henrem - 2) + 'rem;overflow-y:auto'">
    <apercu-notif v-if="ligne.notif"
      :notif="ligne.notif" :id-tribu="ligne.id" :idx="0" nom=""/>

    <div v-if="ligne.nco1">{{$t('DTnbncs', ligne.nco1, {count: ligne.nco1})}}</div>
    <div v-if="ligne.nco2" class="text-bold bg-yellow-3 text-black">
      {{$t('DTnbncb', ligne.nco2, {count: ligne.nco2})}}</div>

    <div>{{$t('DTnbc', [ligne.nbc, ligne.nbsp])}}</div>

    <div class="q-mb-xs row items-center justify-between">
      <quotas-vols class="col-auto" :vols="ligne" />
      <q-btn v-if="pow === 2" size="sm" class="col-auto q-ml-md btn2 q-mr-xs"
        icon="settings" :label="$t('gerer')" dense color="primary" @click="editerq"/>
    </div>

    <div>{{$t('DTv1', [ligne.q1, ed1(ligne.q1), ligne.pca1, ligne.pcv1])}}</div>
    <div>{{$t('DTv2', [ligne.q2, ed2(ligne.q2), ligne.pca2, ligne.pcv2])}}</div>

  </div>

  <!-- Edition de l'info attachée à une tribu -->
  <q-dialog v-model="edcom" persistent>
    <q-card class="bs petitelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTinfo')}}</q-toolbar-title>
      </q-toolbar>
      <div class="q-pa-m">
        <q-input v-model="info" clearable :placeholder="$t('PTinfoph')">
          <template v-slot:append>
            <q-btn dense icon="check" :label="$t('ok')" @click="valider" color="warning"/>
          </template>
          <template v-slot:hint>{{$t('PTinfoh')}}</template>
        </q-input>
      </div>
    </q-card>
  </q-dialog>

  <!-- Dialogue de mise à jour des quotas de la tribu -->
  <q-dialog v-model="edq" persistent>
    <q-card class="bs petitelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqut')}}</q-toolbar-title>
      </q-toolbar>
      <choix-quotas class="q-mt-sm" :quotas="quotas" />
      <q-card-actions>
        <q-btn :disabled="quotas.err" dense size="md" color="primary" 
          icon="check" :label="$t('ok')" @click="validerq"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</div>
</template>

<script>
import { ref, toRef } from 'vue'

import stores from '../stores/stores.mjs'
import { edvol } from '../app/util.mjs'
import { ID, UNITEV1, UNITEV2 } from '../app/api.mjs'
import ApercuNotif from './ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import QuotasVols from './QuotasVols.vue'
import { MD } from '../app/modele.mjs'
import { SetAtrItemComptable } from '../app/operations.mjs'

export default ({
  name: 'DetailTribu',
  props: { 
    henrem: Number,
    ligne: Object // SOIT une ligne de Synthese, SOIT Tribu.synth (qui PEUT avoir un notif)
  },

  components: { ApercuNotif, ChoixQuotas, QuotasVols },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre ' : 'clair ' },
    infoC () { return this.aSt.compta.infoTr(this.ligne.id) }
  },

  data () { return {
    info: '',
    quotas: {}
  }},

  methods: {
    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },

    editer () {
      this.info = this.infoC
      this.ovedcom()
    },
    async valider () {
      await new SetAtrItemComptable().run(this.ligne.id, this.info, null)
      MD.fD()
    },
    editerq () {
      this.quotas = { 
        q1: this.ligne.q1, q2: this.ligne.q2, 
        min1: 0, min2: 0,
        max1: 9999, max2: 9999
      }
      this.ovedq()
    },
    async validerq () {
      await new SetAtrItemComptable().run(this.ligne.id, null, [this.quotas.q1, this.quotas.q2])
      MD.fD()
    }

  },

  setup (props) {
    const aSt = stores.avatar
    const session = stores.session
    const pow = session.pow

    const ligne = toRef(props, 'ligne')

    const edcom = ref(false)
    function ovedcom () { MD.oD(edcom) }
    const edq = ref(false)
    function ovedq () { MD.oD(edq) }

    return {
      edcom, ovedcom, edq, ovedq,
      MD, ID, aSt, session, pow
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn2
  max-height: 1.5rem
</style>
