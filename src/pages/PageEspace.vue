<template>
  <q-page class="column q-pa-xs">
    <div class="q-mb-sm">
      <div class="titre-md">{{$t('PEstm')}}</div>
      <div class="row q-gutter-sm q-mb-sm">
        <btn-cond class="self-start b1" label="M" @ok="dlstat(0)"/>
        <btn-cond class="self-start b1" label="M-1" @ok="dlstat(1)"/>
        <btn-cond class="self-start b1" label="M-2" @ok="dlstat(2)"/>
        <btn-cond class="self-start b1" label="M-3" @ok="dlstat(3)"/>
        <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl" :dinit="maxdl"
          @ok="dlstat2" icon="download" :label="$t('ESdlc')"/>
      </div>
    </div>
    
    <div class="q-mb-sm row justify-start" style="height:1.8rem;overflow:hidden">
      <div class="titre-md q-mx-sm">{{$t('ESnbmi')}}</div>
      <q-select class="col-auto items-start items-start text-bold bg-primary text-white titre-lg q-pl-sm" 
        standout style="position:relative;top:-8px;"
        :disable="session.pow !== 2"
        v-model.number="nbmi" :options="optionsNbmi" dense />
    </div>

    <div class="q-mb-sm">
      <q-toggle v-model="optionA" :label="$t('PTopt')" />
    </div>

    <div class="text-center q-mb-sm">
      <btn-cond cond="cUrgence" icon="add" :label="$t('PTnv')" @ok="ovnvPart"/>
    </div>

    <q-separator color="orange" class="q-my-sm"/>

    <div v-if="synth.length">
    <div class="q-mx-xs" 
      v-for="(lg, idx) in synth" :key="lg.id">
      <q-expansion-item v-if="idx === 0 || session.pow === 2"
        switch-toggle-side expand-separator dense group="trgroup">
        <template v-slot:header>
          <div :class="dkli(idx) + ' row full-width'">
            <div class="col-3 fs-md">
              <span v-if="!lg.id">{{$t('total')}}</span>
              <span v-else>{{session.codePart(lg.id)}}</span>
            </div>
            <div class="col-3">
              {{$t('PEnbc', lg.nbc, { count: lg.nbc })}}, {{$t('PEnbd', lg.nbd, { count: lg.nbd })}}
            </div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q.qc}}<br/>{{lg.pcac}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q.qn}}<br/> {{lg.pcan}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q.qv}}<br/> {{lg.pcav}}%</div>
            <div class="col-2 text-right">
              <q-icon v-if="lg.ntf[0] + lg.ntfp[0] !== 0" name="info" color="primary" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
              <q-icon v-if="lg.ntf[1] + lg.ntfp[1] !== 0" class="bg-yellow-3" name="warning_amber" color="warning" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
              <q-icon v-if="lg.ntf[2] + lg.ntfp[2]" class="bg-yellow-5" name="lock" color="negative" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
            </div>
            <div class="col-1 text-right">
              <btn-cond v-if="lg.id" round icon="open_in_new" stop @ok="pagePartition(lg)"/>
            </div>
          </div>
        </template>
        <div :class="dkli(idx) + 'q-ml-xl q-mb-lg'">
          <div class="row q-gutter-sm justify-center">
            <tuile-cnv type="qc" :src="lg" occupation/>
            <tuile-cnv type="qn" :src="lg" occupation/>
            <tuile-cnv type="qv" :src="lg" occupation/>
            <tuile-notif :src="lg" :total="idx === 0" occupation/>
          </div>
          
          <div v-if="idx !== 0" class="q-my-xs">
            <apercu-notif class="q-ma-sm" :editable="session.pow > 1 && session.pow < 4" 
              :notif="session.mnotifP.get(lg.id)" 
              :type="1" :cible="lg.id" :idx="1"/>
          </div>
          
          <div v-if="session.pow === 2 && idx !== 0" class="row q-mt-xs q-gutter-xs justify-center">
            <btn-cond icon="edit" cond="cUrgence" :label="$t('PEedn')" @ok="editer(lg)"/>
            <btn-cond cond="cUrgence" icon="settings" :label="$t('PEabo')" @ok="editerq(lg)"/>
            <btn-cond :disable="lg.nbc > 0" cond="cUrgence" icon="close" color="warning"
              :label="$t('supprimer')" @ok="supprimer(lg)"/>
          </div>
        </div>
      </q-expansion-item>
    </div>
    </div>

    <!-- Edition du code d'une partition -->
    <q-dialog v-model="ui.d.PEedcom" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTinfo')}}</q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm">
          <q-input v-model="code" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:append>
              <btn-cond icon="check" :label="$t('ok')" @ok="valider" color="warning"/>
            </template>
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialogue de mise à jour des quotas de la partition -->
    <q-dialog v-model="ui.d.PEedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqut')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond :disable="quotas.err || !quotas.chg" icon="check" cond="cUrgence"
            :label="$t('ok')" @ok="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'une nouvelle partition -->
    <q-dialog v-model="ui.d.PEnt" persistent>
      <q-card :class="styp('sm')">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <div class="q-pa-sm">
          <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
        <choix-quotas :quotas="quotas" />
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="add" :disable="!nom || quotas.err" 
            :label="$t('valider')" @ok="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { onMounted, ref } from 'vue'
import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import SaisieMois from '../components/SaisieMois.vue'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import { dkli, styp, $t, afficherDiag } from '../app/util.mjs'
import { ID, AMJ } from '../app/api.mjs'
import { GetSynthese, GetPartition } from '../app/synchro.mjs'
import { SetEspaceOptionA, NouvellePartition, SetQuotasPart, 
  SetCodePart, SupprPartition, DownloadStatC, DownloadStatC2 } from '../app/operations4.mjs'

const fx = [['id', 1], 
  ['ntr2', 1], ['ntr2', -1],
  ['nco2', 1], ['nco2', -1],
  ['q1', 1], ['q1', -1],
  ['q2', 1], ['q2', -1],
  ['pca1', 1], ['pca1', -1],
  ['pca2', 1], ['pca2', -1],
  ['pcv1', 1], ['pcv1', -1],
  ['pcv2', 1], ['pcv2', -1],
  ['nbc', 1], ['nbc', -1]
]

export default {
  name: 'PageEspace',

  props: { },
  components: { BtnCond, SaisieMois, ChoixQuotas, TuileCnv, TuileNotif, ApercuNotif },

  computed: {
    maxdl () { 
      const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
      return Math.floor(m / 100)
    },
    mindl () { 
      return Math.floor(this.session.espace.dcreation / 100)
    },

    synth () {
      if (!this.session.synthese) return []
      const l = []
      const tsp = this.session.synthese.tsp
      for (const id in tsp) l.push(tsp[id])
      const fv = this.fSt.tri.espace
      const f = fv ? fv.value : 0
      const ct = { f: fx[f][0], m: fx[f][1] }
      l.sort((x, y) => {
        if (!x.id) return -1
        if (!y.id) return 1
        const a = x[ct.f]
        const b = y[ct.f]
        return a > b ? ct.m : (a < b ? -ct.m : 0) 
      })
      return l
    },
    optesp () { return this.session.espace ? (this.session.espace.opt ? true : false) : false },
    nbmiesp () { return this.session.espace ? this.session.espace.nbmi : 12 }
  },

  watch: {
    // refixe les valeurs courantes de optionA et nbmi quand elles ont changé dans espace
    optesp (ap) { this.optionA = ap },
    nbmiesp (ap) { this.nbmi = this.session.espace ? this.session.espace.nbmi : 12 },
    async optionA (ap) {
      if (this.session.espace && ((this.session.espace.opt ? true : false) !== ap))
        await new SetEspaceOptionA().run(this.optionA ? 1 : 0, null)
    },
    async nbmi (ap) {
      if (this.session.espace && this.session.espace.nbmi !== ap) 
        new SetEspaceOptionA().run(null, this.nbmi)
    }
  },

  methods: {
    async dlstat (mr) {
      const cleES = this.session.compte.cleE
      const { err, blob, creation, mois } = 
        await new DownloadStatC().run(this.session.espace.org, mr, cleES)
      const nf = this.session.espace.org + '-C_' + mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd' + err))
      }
    },

    async dlstat2 () {
      const cleES = this.session.compte.cleE
      const { err, blob } = await new DownloadStatC2()
        .run(this.session.espace.org, parseInt(this.mois), 'C', cleES)
      const nf = this.session.espace.org + '-C_' + this.mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd' + err))
      }
    },

    async ovnvPart () { 
      this.nom = ''
      this.quotas = { 
        qc: 1, qn: 1, qv: 1, 
        minc: 0, minn: 0, minv: 0,
        maxc: 9999, maxn: 9999, maxv: 9999, 
        n: 0, v: 0,
        err: false
      }
      this.ui.oD('PEnt')
    },

    async creer () {
      await new NouvellePartition().run(this.nom || '', this.quotas)
      await this.refreshSynth()
      this.ui.fD()
    },

    async supprimer (lg) {
      await new SupprPartition().run(lg.id)
      await this.refreshSynth()
      this.ui.fD()
    },

    async lgCourante (lg) {
      this.ligne = lg
      if (!this.session.partition || this.session.partition.id !== lg.id)
        await new GetPartition().run(lg.id)
    },

    async pagePartition (lg) { // Comptable seulement
      await this.lgCourante(lg)
      this.ui.setPage('partition')
    },

    async editer (lg) {
      await this.lgCourante(lg)
      this.code = this.session.compte.mcode.get(this.ligne.id)
      this.ui.oD('PEedcom')
    },

    async valider () {
      await new SetCodePart().run(this.ligne.id, this.code)
      this.ui.fD()
    },

    async editerq (lg) {
      await this.lgCourante(lg)
      const q = this.ligne.q
      this.quotas = { 
        qc: q.qc, qn: q.qn, qv: q.qv,
        minc: 0, minn: 0, minv: 0,
        maxc: 9999, maxn: 9999, maxv: 9999,
        err: ''
      }
      this.ui.oD('PEedq')
    },

    async validerq () {
      await new SetQuotasPart().run(this.ligne.id, this.quotas)
      await this.refreshSynth()
      this.ui.fD()
    }
  },

  data () {
    return {
      mois: Math.floor(this.session.auj / 100),
      nom: '',
      quotas: null,
      code: '',
      ligne: null,
      optionsNbmi: [3, 6, 12, 18, 24],
      nbmi: this.session.espace ? this.session.espace.nbmi : 12,
      optionA: this.session.espace ? (this.session.espace.opt ? true : false) : false
    }
  },

  setup (props) {
    const ui = stores.ui
    const idc = ref(ui.getIdc())

    async function refreshSynth () {
      await new GetSynthese().run()
    }

    onMounted(async () => {
      await refreshSynth()
    })

    return {
      refreshSynth, // force le rechargement de Synthese (qui n'est pas synchronisé)
      ID, AMJ, dkli, styp,
      aSt: stores.avatar,
      fSt: stores.filtre,
      session: stores.session,
      ui, idc
    }
  }

}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.w10
  width: 10rem
.b1
  width: 4rem
</style>
