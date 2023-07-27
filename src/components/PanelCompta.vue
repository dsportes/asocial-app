<template>
  <div class="q-pa-sm full-width">
    <div class="q-my-sm q-mx-sm row justify-between items-center">
      <quotas-vols :vols="c" />
      <q-btn v-if="session.estSponsor || session.estComptable" size="md" class="q-ml-sm"
          icon="settings" :label="$t('gerer')" dense color="primary" @click="editerq"/>
    </div>

    <div v-if="c.pc1 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal1a', [c.pc1])}}</div>
      <div>{{$t('CPTal1b')}}</div>
    </div>

    <div v-if="c.pc2 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal2a', [c.pc2])}}</div>
      <div>{{$t('CPTal2b')}}</div>
    </div>

    <div class="titre-lg q-my-md">{{$t('CPTj')}} : {{edj}}</div>

    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{c.q1 + ' / ' + ed1(c.q1)}}</div>
      <div class="col-10 fs-md">{{$t('CPTq1')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v1)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv1', [c.pc1])}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v1m)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv1m')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{c.q2 + ' / ' + ed2(c.q2)}}</div>
      <div class="col-10 fs-md">{{$t('CPTq2')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v2)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv2', [c.pc2])}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v2m)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv2m')}}</div>
    </div>

    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.trj)}}</div>
      <div class="col-10 fs-md">{{$t('CPTtrj')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.trm)}}</div>
      <div class="col-10 fs-md">{{$t('CPTtrm')}}</div>
    </div>

    <div class="titre-md q-mt-md">{{$t('CPTtr')}}</div>
      <div class="row items-start q-my-sm q-ml-md">
        <div class="col-2 text-center font-mono">{{edp(c.tr8[0])}}</div>
        <div class="col-10 fs-md">{{$t('CPTmoy')}}</div>
      </div>
    <div class="q-my-sm q-ml-md">
      <div v-for="(x, i) in lst7j()" :key="i" class="row items-start">
        <div class="col-2 text-center font-mono">{{edp(c.tr8[i + 1])}}</div>
        <div class="col-10 fs-md">{{$t('jour' + x)}}</div>
      </div>
    </div>

    <div class="titre-md q-mt-md">{{$t('CPTHist')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHq1')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHq2')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHv1')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHv2')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHtr')}}</div>

    <div class="q-ml-md q-mt-md row items-center">
      <div class="col-2 text-center text-bold">q1</div>
      <div class="col-2 text-center text-bold">q2</div>
      <div class="col-2 text-center text-bold">v1</div>
      <div class="col-2 text-center text-bold">v2</div>
      <div class="col-2 text-center text-bold">tr</div>
      <div class="col-2 text-bold self-start">{{$t('mois')}}</div>
    </div>

    <div class="q-my-sm q-ml-md">
      <div v-for="(x, i) in lst12m()" :key="i" class="row items-center">
        <div class="col-2 text-center font-mono">{{ed1(c.hist[i][0])}}</div>
        <div class="col-2 text-center font-mono">{{ed2(c.hist[i][1])}}</div>
        <div class="col-2 text-center font-mono">{{edp(c.hist[i][2])}}</div>
        <div class="col-2 text-center font-mono">{{edp(c.hist[i][3])}}</div>
        <div class="col-2 text-center font-mono">{{edp(c.hist[i][4])}}</div>
        <div class="col-2 self-start">{{$t('mois' + x)}}</div>
      </div>
    </div>

    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="edq" persistent>
      <q-card class="petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions>
          <q-btn :disabled="quotas.err" dense size="md" color="primary" icon="check" 
          :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script>
import { ref } from 'vue'
import { UNITEV1, UNITEV2, AMJ, pow } from '../app/api.mjs'
import { edvol, dhcool } from '../app/util.mjs'
import QuotasVols from './QuotasVols.vue'
import ChoixQuotas from './ChoixQuotas.vue'
import stores from '../stores/stores.mjs'
import { SetQuotas, GetCompteursCompta } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

/** Compteurs ***************************
- `j` : **date du dernier calcul enregistré** : par exemple le 17 Mai de l'année A
- **pour le mois en cours**, celui de la date ci-dessus :
  - `q1 q2`: quotas actuels.
  - `v1 v2 v1m v2m`: volume actuel des notes et moyens sur le mois en cours.
  - `trj` : transferts cumulés du jour.
  - `trm` : transferts cumulés du mois.
- `tr8` : log des volumes des transferts cumulés journaliers de pièces jointes 
  sur les 7 derniers jours + total (en tête) sur ces 7 jours.
- **pour les 12 mois antérieurs** `hist` (dans l'exemple ci-dessus Mai de A-1 à Avril de A),
  - `q1 q2` quotas q1 et q2 au dernier jour du mois.
  - `v1 v2` log des volumes moyens du mois (log de v1m v2m ci-dessus au dernier jour du mois)
  - `tr` log du total des transferts des pièces jointes dans le mois (log de trm à la fin du mois).
*/

export default ({
  name: 'PanelCompta',

  props: { },

  components: { QuotasVols, ChoixQuotas },

  computed: {
    edj () { return AMJ.editDeAmj(this.c.j) }
  },

  data () {
    return {
      dhcool: dhcool,
      quotas: null
    }
  },

  methods: {
    ed (v) { return edvol(v) },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    edp (v) { return edvol(pow(v) * UNITEV2) },

    // Retourne la liste des indices des 7 derniers jours (précédent le jour j)
    lst7j () {
      const l = new Array(7)
      let j = AMJ.jDeAmjUtc(this.c.j)
      for(let i = 0; i < 7; i++){
        j--
        if (j === 0) j = 7
        l[i] = j
      }
      return l
    },
  
    // Retourne la liste des indices des 12 derniers mois (précédent le jour j)
    lst12m () {
      const l = new Array(12)
      let j = AMJ.mm(this.c.j)
      for(let i = 0; i < 12; i++){
        j--
        if (j === 0) j = 12
        l[i] = j
      }
      return l
    },

    async editerq () {
      if (! await this.session.edit()) return
      const tr = this.aSt.tribuC
      this.quotas = { q1: this.c.q1, q2: this.c.q2, min1: 0, min2: 0, 
        max1: tr.cpt.q1 - tr.cpt.a1,
        max2: tr.cpt.q2 - tr.cpt.a2
        }
      this.ovedq()
    },
    async validerq () {
      await new SetQuotas().run(this.aSt.tribuC.id, this.c.id, this.quotas.q1, this.quotas.q2)
      MD.fD()
      await new GetCompteursCompta().run(this.c.id)
    },
  },

  setup () {
    const aSt = stores.avatar
    const c = ref(aSt.ccCpt)

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setccCpt') {
          c.value = aSt.ccCpt
        }
      })
    })

    const edq = ref(false)
    function ovedq () { MD.oD(edq) }

    return {
      MD, edq, ovedq,
      session: stores.session,
      aSt,
      c
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
