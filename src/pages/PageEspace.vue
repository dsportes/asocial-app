<!--
Source principale : Synthese
Depuis PageAdmin par l'administrateur: ns est donné par PageAdmin
- les "tribus / tranche d'allocation de quotas" n'ont PAS de nom
- dans DetailTribu les notifs tribu ne sont pas accessibles, seulement leurs gravités
- la création d'une nouvelle tribu n'est pas possible
- zoom impossible sur une tribu
Depuis un Comptable: ns est celui de la session
- les "tribus / tranche d'allocation de quotas" ont un nom / info
- dans DetailTribu les notifs tribu sont accessibles
- la création d'une nouvelle tribu est possible
- zoom possible sur une tribu
- source secondaire de données: compta.act
-->
<template>
  <q-page class="column q-pa-xs">
    <div v-if="session.pow <= 2" class="q-mb-sm">
      <div class="titre-md">{{$t('PEstm')}}</div>
      <div class="row q-gutter-sm q-mb-sm">
        <q-btn class="self-start" dense color="warning" padding="none xs" size="md" label="M" @click="dlstat(0)"/>
        <q-btn class="self-start" dense color="primary" padding="none xs" size="md" label="M-1" @click="dlstat(1)"/>
        <q-btn class="self-start" dense color="primary" padding="none xs" size="md" label="M-2" @click="dlstat(2)"/>
        <q-btn class="self-start" dense color="primary" padding="none xs" size="md" label="M-3" @click="dlstat(3)"/>
        <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl" :dinit="maxdl"
          @ok="dlstat2" icon="download" :label="$t('ESdlc')"/>
      </div>
    </div>

    <div class="q-mb-sm">
      <saisie-mois v-if="session.pow === 1" v-model="dlvat" 
        :dmax="maxdlvat" :dmin="mindlvat" :dinit="initdlvat"
        @ok="setDlvat" icon="check" :label="$t('ESdlvat')"/>
      <span v-if="session.pow > 1" class="titre-md">
        {{$t('ESdlvat2', [AMJ.editDeAmj(espace.dlvat)])}}
      </span>
    </div>

    <div class="q-mb-sm row justify-start" style="height:1.8rem;overflow:hidden">
      <q-btn class="col-auto self-start q-mr-sm"
        dense size="md" color="primary" padding="none" round 
        :disable="session.pow !== 2 || espace.nbmi === nbmi" icon="undo" 
        @click="undoNbmi"/>
      <q-btn class="col-auto self-start q-mr-sm" dense size="md" color="warning" padding="none" round 
        :disable="session.pow !== 2 || espace.nbmi === nbmi" icon="check" @click="saveNbmi"/>
      <div class="tire-md q-mr-sm">{{$t('ESnbmi')}}</div>
      <q-select class="col-auto items-start items-start text-bold bg-primary text-white titre-lg q-pl-sm" 
        borderless style="position:relative;top:-8px;"
        :disable="session.pow !== 2"
        v-model.number="nbmi" :options="optionsNbmi" dense />
    </div>

    <div v-if="session.pow === 2" class="row q-mb-sm justify-start">
      <q-btn class="col-auto self-start q-mr-sm"
        dense size="md" color="primary" padding="none" round 
        :disable="!chgOptionA" icon="undo" @click="undoOptionA"/>
      <q-btn class="col-auto self-start" dense size="md" color="warning" padding="none" round 
        :disable="!chgOptionA" icon="check" @click="saveOptionA"/>
      <q-select class="col q-ml-sm self-start" borderless style="position:relative;top:-8px"
        v-model="optionA" :options="options" dense />
    </div>

    <div v-if="session.pow === 2" class="row justify-center q-mb-sm">
      <q-btn class="col-auto" size="md" padding="xs" dense color="primary" 
        :label="$t('PTnv')" @click="ouvrirnt"/>
    </div>

    <q-separator color="orange" class="q-my-sm"/>

    <div v-if="synth.length">
    <div class="q-mx-xs" 
      v-for="(lg, idx) in synth" :key="lg.id" @click="lgCourante(lg)">
      <q-expansion-item switch-toggle-side expand-separator dense group="trgroup">
        <template v-slot:header>
          <div :class="dkli(idx) + ' row full-width'">
            <div class="col-3 fs-md">
              <span v-if="!lg.id">{{$t('total')}}</span>
              <span v-else>#{{ID.court(lg.id)}}
                <span v-if="session.pow === 2" class= "q-ml-sm">{{session.compte.codeP(lg.id)}}</span>
              </span>
            </div>
            <div class="col-4">
              {{$t('PEnbc', lg.nbc, { count: lg.nbc })}}, {{$t('PEnbd', lg.nbd, { count: lg.nbd })}}
            </div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.qc}}<br/>{{lg.pcac}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.qn}}<br/> {{lg.pcan}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.qv}}<br/> {{lg.pcav}}%</div>
            <div class="col-2">
              <q-icon v-if="lg.ntr0 + lg.nco0 !== 0" name="info" color="primary" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
              <q-icon v-if="lg.ntr1 + lg.nco1 !== 0" class="bg-yellow-3" name="warning_amber" color="warning" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
              <q-icon v-if="lg.ntr2 + lg.nco2 !== 0" class="bg-yellow-5" name="lock" color="negative" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
            </div>
          </div>
        </template>
        <div :class="dkli(idx) + 'q-ml-xl q-mb-lg'">
          <div class="row q-gutter-sm">
            <tuile-cnv type="qc" :src="lg" occupation/>
            <tuile-cnv type="qn" :src="lg" occupation/>
            <tuile-cnv type="qv" :src="lg" occupation/>
            <tuile-notif :src="lg" :total="idx === 0" occupation/>
          </div>
          <div v-if="idx !== 0" class="q-my-xs">
            <apercu-notif :editable="session.pow > 1 && session.pow < 4" :notif="notif" :type="1" 
              :ctx="{ idt: lg.id }" :idx="idx"/>
          </div>
          <div v-if="session.pow === 2 && idx !== 0" class="row q-mt-xs q-gutter-xs">
            <q-btn class="fs-md" size="sm" dense padding="xs"
              color="primary" :icon="lg.info ? 'edit' : 'add'" 
              :label="$t('PEedn')" @click="editer"/>
            <q-btn size="sm" class="fs-md" padding="xs"
              icon="settings" :label="$t('PEabo')" dense color="primary" @click="editerq"/>
            <q-btn v-if="lg.id" class="fs-md" size="sm" dense color="primary" padding="xs"
              :label="$t('detail')" icon-right="open_in_new" @click="pageTranche"/>
          </div>
        </div>
      </q-expansion-item>
    </div>
    </div>

    <!-- Suivi du changement d'une dlvat -->
    <q-dialog v-model="ui.d.PEdlvat" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTdlvat')}}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-ma-sm">
          <div class="q-my-md row justify-around">
            <div class="titre-md">{{$t('PTdlvata', [AMJ.editDeAmj(espace.dlvat)])}}</div>
            <div class="titre-md">{{$t('PTdlvatf', [AMJ.editDeAmj(dlv)])}}</div>
          </div>
          <div class="row q-my-sm">
            <div class="col-4"/>
            <div class="col-4 text-italic titre-md text-center">{{$t('PTdlvat1')}}</div>
            <div class="col-4 text-italic titre-md text-center">{{$t('PTdlvat2')}}</div>
          </div>
          <div class="row q-my-xs">
            <div class="col-4 text-italic titre-md">{{$t('PTdlvat3')}}</div>
            <div class="col-4 font-mono fs-md text-center">{{nbav1}}</div>
            <div class="col-4 font-mono fs-md text-center">{{nbav2}}</div>
          </div>
          <div class="row q-my-xs">
            <div class="col-4 text-italic titre-md">{{$t('PTdlvat4')}}</div>
            <div class="col-4 font-mono fs-md text-center">{{nbmb1}}</div>
            <div class="col-4 font-mono fs-md text-center">{{nbmb2}}</div>
          </div>
        </q-card-section>

        <q-card-actions vertical align="right">
          <bouton-confirm class="q-my-md maauto" :actif="stp===2" :confirmer="chgDlvat"/>
          <q-btn dense size="md" no-caps padding="xs" color="primary" :disable="stp < 3" 
            :label="$t('PTdlterm', [nbmb2 + nbav2])" @click="ui.fD" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edition de l'info attachée à une tribu -->
    <q-dialog v-model="ui.d.PEedcom" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTinfo')}}</q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm">
          <q-input v-model="info" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:append>
              <q-btn dense icon="check" padding="xs" :label="$t('ok')" @click="valider" color="warning"/>
            </template>
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialogue de mise à jour des quotas de la tribu -->
    <q-dialog v-model="ui.d.PEedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqut')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn :disable="quotas.err" dense size="md" padding="xs" color="primary" icon="check" 
            :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="ui.d.PEnt" persistent>
      <q-card :class="stype('sm')">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <div class="q-pa-sm">
          <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
        <choix-quotas :quotas="quotas" />
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense color="primary" padding="xs" size="md" icon="undo" 
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense color="warning" padding="xs" size="md" icon="check" 
            :disable="!nom || quotas.err" :label="$t('valider')" @click="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { onMounted, toRef, ref } from 'vue'
import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import SaisieMois from '../components/SaisieMois.vue'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import { SetNotifT } from '../app/operations.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { dkli, styp, $t, afficherDiag } from '../app/util.mjs'
import { ID, AMJ } from '../app/api.mjs'
import { GetSynthese, SetEspaceOptionA } from '../app/synchro.mjs'
import { DownloadStatC, DownloadStatC2, NouvelleTribu, GetTribu, 
  AboTribuC, SetAtrItemComptable,
  GetVersionsDlvat, GetMembresDlvat, ChangeAvDlvat, ChangeMbDlvat } from '../app/operations.mjs'

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

  props: { ns: Number },
  components: { SaisieMois, ChoixQuotas, TuileCnv, TuileNotif, ApercuNotif, BoutonConfirm },

  computed: {
    maxdl () { 
      const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
      return Math.floor(m / 100)
    },
    mindl () { 
      return Math.floor(this.espace.dcreation / 100)
    },
    mindlvat () { 
      const m = AMJ.djMoisN(AMJ.amjUtc(), 3)
      return Math.floor(m / 100)
    },
    initdlvat () {
      return Math.floor(this.espace.dlvat / 100)
    },
    maxdlvat () { 
      return Math.floor(AMJ.max / 100)
    },
    synth () {
      if (!this.session.synthese) return []
      const l = this.session.synthese.tp
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
    notif () { return this.session.pow === 2 ? this.aSt.tribuC.notif : null },
    optesp () { return this.session.espace ? this.session.espace.opt : 0 },
    chgOptionA () { return this.session.espace.opt !== this.optionA.value },
    tribuv () { const t = this.aSt.tribuC; return t ? [t.id, t.v] : [0, 0] }
  },

  watch: {
    synth (l) { // repositionnement de la ligne courante sur la nouvelle valeur
      if (this.aSt.tribuC)
        l.forEach(s => { if (s.id === this.session.tribuCId) { this.ligne = s } })
      else
        this.ligne = l[0] // ligne de synthèse courante initiale
    },

    optesp (ap) { // refixe la valeur courante de l'option A quand elle a changé dans espace
      this.optionA = this.options[ap]
    },

    async tribuv (ap) {
      if (this.session.status > 2)
        await this.refreshSynth()
    }
  },

  methods: {
    async dlstat (mr) {
      const { err, blob, creation, mois } = await new DownloadStatC().run(this.espace.org, mr)
      const nf = this.espace.org + '-C_' + mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd' + err))
      }
    },

    async dlstat2 () {
      const { err, blob } = await new DownloadStatC2().run(this.ns, parseInt(this.mois), 'C')
      const nf = this.espace.org + '-C_' + this.mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd') + err)
      }
    },

    async ouvrirnt () { 
      if (!await this.session.editpow(2)) return
      this.nom = ''
      this.quotas = { q1: 1, q2: 1, qc: 1, min1: 0, min2: 0, max1: 9999, max2: 9999, minc: 1, maxc: 9999, err: false }
      this.ui.oD('PEnt')
    },
    async creer () {
      await new NouvelleTribu().run(this.nom || '', [this.quotas.qc, this.quotas.q1, this.quotas.q2])
      this.ui.fD()
    },

    async lgCourante (lg) {
      if (!lg.id) return
      if (this.session.pow === 2) {
        const t = await this.getTr(lg.id)
        this.ligne = t.synth
      } else {
        this.ligne = lg
      }
    },

    async getTr (id) { // rend courante cette tribu
      if (this.session.tribuCId === id) return this.aSt.tribuC // elle l'était déjà

      let t = this.aSt.getTribu(id)
      let abot = false
      if (!t) {
        t = await new GetTribu().run(id, true) // true: abonnement
        abot = true
      }
      // abonnement à la nouvelle tribu courante
      if (this.session.fsSync) {
        // désabonne l'actuelle courante si nécessaire et pas tribu du compte
        await this.session.fsSync.setTribuC(id) 
      } else {
        // ce qui désabonne de facto de la précédente (mais pas de celle du compte)
        if (!abot) await new AboTribuC().run(id)
      }

      this.session.setTribuCId(id)
      this.aSt.setTribuC(t)
      return t
    },

    async pageTranche () { // Comptable seulement
      if (!await this.session.editpow(2, true)) return
      await this.getTr(this.ligne.id)
      this.ui.setPage('tranche')
    },

    async chgNtfT (ntf) {
      await new SetNotifT().run(this.ligne.id, ntf)
    },
    async editer () {
      if (!await this.session.editpow(2)) return
      this.info = this.infoC
      this.ui.oD('PEedcom')
    },
    async valider () {
      await new SetAtrItemComptable().run(this.ligne.id, this.info, null)
      this.ui.fD()
    },
    async editerq () {
      if (!await this.session.editpow(2)) return
      this.quotas = { 
        q1: this.ligne.q1, q2: this.ligne.q2, qc: this.ligne.qc,
        min1: 0, min2: 0, minc: 0,
        max1: 9999, max2: 9999, maxc: 9999
      }
      this.ui.oD('PEedq')
    },
    async validerq () {
      await new SetAtrItemComptable().run(this.ligne.id, null, [this.quotas.qc, this.quotas.q1, this.quotas.q2])
      this.ui.fD()
    },

    setOptionA (e) { this.optionA = this.options[e.opt] },

    undoOptionA () { this.optionA = this.options[this.session.espace.opt] },

    async saveOptionA () {
      await new SetEspaceOptionA().run(this.optionA.value)
    },

    undoNbmi () { this.nbmi = this.espace.nbmi},

    async saveNbmi () {
      console.log(this.nbmi)
      await new SetEspaceOptionA().run(null, this.nbmi)
    },

    splitLst (lst) {
      const r = []
      let t = []
      for(let i = 0; i < lst.length; i++) {
        t.push(lst[i])
        if (t.length === 10) { r.push(t); t = [] }
      }
      if (t.length) r.push(t)
      return r
    },

    async setDlvat () {
      this.dlv = AMJ.pjMoisSuiv((this.dlvat * 100) + 1)
      this.stp = 1; this.nbav1 = 0; this.nbav2; this.nbmb1 = 0; this.nbmb2 = 0
      this.ui.oD('PEdlvat')
      const lav = await new GetVersionsDlvat().run(this.espace.dlvat)
      this.nbav1 = lav.length
      this.lstav = this.splitLst(lav)
      const lmb = await new GetMembresDlvat().run(this.espace.dlvat)
      this.nbmb1 = lmb.length
      this.lstmb = this.splitLst(lmb)
      this.stp = 2
    },

    async chgDlvat () {
      for(let i = 0; i < this.lstav.length; i++) {
        const lids = this.lstav[i]
        await new ChangeAvDlvat().run(this.dlv, lids)
        this.nbav2 += lids.length
      }
      for(let i = 0; i < this.lstmb.length; i++) {
        const lidids = this.lstmb[i]
        await new ChangeMbDlvat().run(this.dlv, lidids)
        this.nbmb2 += lidids.length
      }
      await new SetEspaceOptionA().run(null, null, this.dlv )
      this.stp = 3
    }

  },

  data () {
    return {
      dlvat: 0, // dlvat saisie
      dlv: 0, // Premier jour du mois suivant de dlvat
      nbav1: 0, // nombre d'avatars à traiter
      nbav2: 0, // nombre d'avatars traités
      nbmb1: 0, // nombre de membres à traiter
      nbmb2: 0, // nombre de membres traités
      lstav: null, // av à traiter
      lstmb: null, // mb à traiter
      stp: 0, // 0: pas lancé, 1: décompte en cours, 2: décompte terminé, 3: maj terminée

      mois: Math.floor(this.session.auj / 100),
      nom: '',
      quotas: null,
      ligne: null,
      optionA: this.options[this.espace.opt],
      optionsNbmi: [3, 6, 12, 18, 24],
      nbmi: this.espace.nbmi
    }
  },

  /** Synthese *********************************************
  _data_:
  - `id` : id de l'espace
  - `v` : date-heure d'écriture
  - `atr` : sérialisation de la table des synthèses des tribus de l'espace. 
    L'indice dans cette table est l'id très court de la tribu (sans le 4 en tête). 
    Chaque élément est la sérialisation de:
    - `q1 q2` : quotas de la tribu.
    - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
    - `v1 v2` : somme des volumes (approximatifs) effectivement utilisés.
    - `ntr1` : nombre de notifications tribu_simples
    - `ntr2` : nombre de notifications tribu bloquantes
    - `nbc` : nombre de comptes.
    - `nbsp` : nombre de sponsors.
    - `nco1` : nombres de comptes ayant une notification simple.
    - `nco2` : nombres de comptes ayant une notification bloquante.
    Calculé localement :
    - pca1 : pourcentage d'affectation des quotas : a1 / q1
    - pca2
    - pcv1 : pourcentage d'utilisation effective des quotas : v1 / q1
    - pcv2
  atr[0] est la somme des atr[1..N] : calculé sur compile (pas stocké)
  */
  setup (props) {
    const ns = toRef(props, 'ns')
    const ui = stores.ui
    const aSt = stores.avatar
    const fSt = stores.filtre
    const session = stores.session
    const espace = ref(session.espaces.get(ns.value))

    const options = [
      { label: $t('PTopt0'), value: 0 },
      { label: $t('PTopt1'), value: 1 },
      { label: $t('PTopt2'), value: 2 },
    ]

    async function refreshSynth () {
      await new GetSynthese().run(ns.value)
    }

    onMounted(async () => {
      await refreshSynth()
    })

    return {
      refreshSynth, // force le rechargement de Synthese (qui n'est pas synchronisé)
      ID, AMJ, dkli, styp, options, espace,
      aSt, fSt, session, ui
    }
  }

}
</script>
<style lang="css">
.q-item__section--avatar { min-width: 0 !important; }
</style>
<style lang="sass" scoped>
@import '../css/app.sass'
.w10
  width: 10rem
</style>
