<template>
  <div :class="'col items-start ' + dkli(idx)">
    <div class="q-ml-md">
      <span class="text-bold fs-md q-mr-sm">{{t.nom}}</span>
      <q-btn v-if="edit && session.estComptable" class="q-ml-md btn2" size="sm" dense
        :label="$t('PTecr')" color="primary" icon="edit" @click="editer"/>
    </div>

    <div class="q-ml-md titre-md">{{$t('NTnbcsp', [t.cpt.nbc, t.cpt.nbsp])}}</div>

    <apercu-notif class="q-ml-md q-mr-xs" :notif="t.notif"
      :id-tribu="t.id" :nom="t.nom" :idx="idx"/>

    <div class="q-ml-md q-mb-xs row largeur40 justify-between items-center">
      <quotas-vols class="col" :vols="t.cpt" />
      <q-btn v-if="session.estComptable" size="sm" class="col-auto q-ml-lg btn2 q-mr-xs"
        icon="settings" :label="$t('gerer')" dense color="primary" @click="editerq"/>
    </div>

    <div class="q-ml-md q-mt-sm">
      <div class="titre-md">{{$t('PTncoS', [t.cpt.ncoS])}}</div>
      <div class="titre-md">{{$t('PTncoB', [t.cpt.ncoB])}}</div>
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

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { SetAtrItemComptable } from '../app/operations.mjs'
import QuotasVols from './QuotasVols.vue'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuTribu',

  props: { 
    id: Number // id de la tribu
  },

  components: { QuotasVols, ApercuNotif, ChoixQuotas },

  computed: { 
    q1 () { return this.ed1(this.t.q1 || 0)},
    q2 () { return this.ed2(this.t.q2 || 0)},
    pc1 () {
      const x = this.t.synth
      return !x.a1 || !x.q1 ? 0 : (Math.round((x.a1 * 100) / x.q1))
    },
    pc2 () {
      const x = this.t.synth
      return !x.a2 || !x.q2 ? 0 : (Math.round((x.a2 * 100) / x.q2))
    }
  },

  data () { return {
    info: '',
    bloc: null,
    quotas: {}
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    editer () {
      this.info = this.t.info
      this.ovedcom()
    },
    async valider (txt) {
      await new SetAtrItemComptable().run(this.id, txt, null)
      MD.fD()
    },
    editerq () {
      this.quotas = { q1: this.t.q1, q2: this.t.q2, min1: 0, min2: 0, 
        max1: 9999,
        max2: 9999
      }
      this.ovedq()
    },
    async validerq () {
      await new SetAtrItemComptable().run(this.id, null, [this.quotas.q1, this.quotas.q2])
      MD.fD()
    }
  },

  setup (props) {
    const aSt = stores.avatar
    const session = stores.session
    const id = toRef(props, 'id')

    function getT () { return aSt.getTribu(id.value) }

    const t = ref(getT())

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribu' && args[0].id === id.value) {
          t.value = getT()
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => id.value, (ap, av) => {
        t.value = getT()
      }
    )

    const edcom = ref(false)
    function ovedcom () { MD.oD(edcom) }
    const edq = ref(false)
    function ovedq () { MD.oD(edq) }

    return {
      MD, edcom, ovedcom, edq, ovedq,
      session, aSt,
      t
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn2
  max-height: 1.3rem
</style>
