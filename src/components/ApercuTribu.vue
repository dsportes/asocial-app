<template>
  <div :class="'col items-start ' + dkli(idx)">
    <div>
      <span class="text-bold fs-md q-mr-sm">{{t.na.nom}}</span> 
      <span class="text-bold fs-sm font-mono q-mr-sm">#{{id}}</span> 
    </div>

    <div v-if="t.info" class="q-ml-md q-my-xs bord row justify-between items-center">
      <show-html class="col" :idx="idx" zoom maxh="3rem" :texte="t.info"/>
      <q-btn v-if="edit && session.estComptable" color="col-auto primary btn2 q-mr-xs" 
        class="col-auto q-ml-sm btn2" size="sm" dense icon="edit" @click="editer"/>
    </div>
    <div v-else class="q-ml-md q-my-xs row justify-between items-center">
      <span class="col titre-md">{{$t('PTnoinfo')}}</span>
      <q-btn v-if="edit && session.estComptable" class="col-auto q-ml-sm btn2 q-mr-xs" size="sm" dense
        :label="$t('PTecr')" color="primary" icon="edit" @click="editer"/>
    </div>

    <div class="q-ml-md titre-md">{{$t('NTnbcsp', [t.cpt.nbc, t.cpt.nbsp])}}</div>

    <apercu-notif class="q-ml-md q-mr-xs" :notif="t.notif" :na-tribu="t.na" :na-cible="t.na" :idx="idx"/>

    <div class="q-ml-md q-mb-xs row largeur40 justify-between items-center">
      <quotas-vols class="col" :vols="t.cpt" />
      <q-btn v-if="session.estComptable" size="sm" class="col-auto q-ml-lg btn2 q-mr-xs"
        icon="settings" :label="$t('gerer')" dense color="primary" @click="editerq"/>
    </div>

    <div class="q-ml-md q-mt-sm">
      <div class="titre-md">{{$t('PTncoS', [t.cpt.ncoS])}}</div>
      <div class="titre-md">{{$t('PTncoB', [t.cpt.ncoB])}}</div>
    </div>

    <!-- Edition du commentaire attachée à une tribu -->
    <q-dialog v-model="edcom" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NTcom', [t.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md style="height:50vh" :lgmax="250" editable :texte="t.info"
          :label-ok="$t('valider')" modetxt @ok="valider"/>
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
import ShowHtml from './ShowHtml.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { SetQuotasTribu } from '../app/operations.mjs'
import { crypter } from '../app/webcrypto.mjs'
import BoutonHelp from './BoutonHelp.vue'
import EditeurMd from './EditeurMd.vue'
import QuotasVols from './QuotasVols.vue'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuTribu',

  props: { 
    id: Number, // id de la tribu
    idx: Number, edit: Boolean
  },

  components: { QuotasVols, ShowHtml, ApercuNotif, EditeurMd, BoutonHelp, ChoixQuotas },

  computed: { 
    q1 () { return this.ed1(this.t.cpt.q1 || 0)},
    q2 () { return this.ed2(this.t.cpt.q2 || 0)},
    pc1 () {
      const x = this.t.cpt
      return !x.a1 || !x.q1 ? 0 : (Math.round((x.a1 * 100) / x.q1))
    },
    pc2 () {
      const x = this.t.cpt
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
      this.info = this.t.info || ''
      this.ovedcom()
    },
    async valider (txt) {
      const buf = txt ? await crypter(this.session.clek, txt) : null
      await new SetInfoTribu().run(this.id, 'infok', buf)
      MD.fD()
    },
    editerq () {
      this.quotas = { q1: this.t.cpt.q1, q2: this.t.cpt.q2, min1: 0, min2: 0, 
        max1: 9999,
        max2: 9999
      }
      this.ovedq()
    },
    async validerq () {
      await new SetQuotasTribu().run(this.id, this.quotas.q1, this.quotas.q2)
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
        if ((name === 'setTribu' || name === 'setTribu2') && args[0].id === id.value) {
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
      session,
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
