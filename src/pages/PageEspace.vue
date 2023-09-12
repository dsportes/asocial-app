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
  <q-page class="column">
    <!--div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div-->

    <div :class="pow === 1 ? 'sep1' : 'sep2'"/>

    <div :class="dkli(idx) + ' q-mb-sm q-mx-xs'" 
      v-for="(lg, idx) in synth" :key="lg.id" @click=lgCourante(lg)>
      <div class="row q-gutter-sm">
        <tuile-cnv type="qc" :src="lg" occupation/>
        <tuile-cnv type="q1" :src="lg" occupation/>
        <tuile-cnv type="q2" :src="lg" occupation/>
      </div>
    </div>

    <div :class="dkli(idx) + ' q-mb-sm q-mx-xs'" 
      v-for="(lg, idx) in synth" :key="lg.id" @click=lgCourante(lg)>
      <div :class="'zone cursor-pointer' + (ligne && (ligne.id === lg.id) ? ' courant' : '')"
        style="overflow:hidden;max-height:3rem">
        <div class="row col-auto"> <!-- ligne 1 -->
          <div class="col-3 fs-md">
            <span v-if="!lg.id">{{$t('total')}}</span>
            <span v-else>#{{ID.court(lg.id)}}
              <span v-if="pow === 2" class= "q-ml-sm">{{aSt.compta.infoTr(lg.id)}}</span>
            </span>
          </div>
          <div class="col-1 font-mono text-center">{{lg.nbc ? lg.nbc : '-'}}</div>
          <div class="col-1 font-mono text-center">{{lg.ntr1 ? lg.ntr1 : '-'}}</div>
          <div class="col-1 font-mono text-center">{{lg.nco1 ? lg.nco1 : '-'}}</div>
          <div class="col-1 text-italic bl">V1</div>
          <div class="col-1 font-mono text-center">[{{lg.q1}}]</div>
          <div class="col-2 font-mono text-center">{{ed1(lg.q1)}}</div>
          <div class="col-1 font-mono text-center">{{lg.pca1}}%</div>
          <div class="col-1 font-mono text-center">{{lg.pcv1}}%</div>
        </div>

        <div class="row col-auto"> <!-- ligne 2 -->
          <div class="col-3"></div>
          <div class="col-1 font-mono text-center">{{lg.nbsp ? lg.nbsp : '-'}}</div>
          <div :class="cell(lg.ntr2)">{{lg.ntr2 ? lg.ntr2 : '-'}}</div>
          <div :class="cell(lg.nco2)">{{lg.nco2 ? lg.nco2 : '-'}}</div>
          <div class="col-1 text-italic bl">V2</div>
          <div class="col-1 font-mono text-center">[{{lg.q2}}]</div>
          <div class="col-2 font-mono text-center">{{ed2(lg.q2)}}</div>
          <div class="col-1 font-mono text-center">{{lg.pca2}}%</div>
          <div class="col-1 font-mono text-center">{{lg.pcv2}}%</div>
        </div>
      </div>
    </div>
    <q-separator color="primary"/>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="nt" persistent>
      <q-card class="bs moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <div class="q-pa-m">
          <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
            <!--
            <template v-slot:append>
              <q-btn dense icon="check" :label="$t('ok')" @click="valider" color="warning"/>
            </template>
            -->
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
        <choix-quotas :quotas="quotas" />
        <q-card-actions>
          <q-btn flat dense color="warning" icon="close" :label="$t('renoncer')" @click="MD.fD"/>
          <q-btn flat dense color="primary" icon="check" :disabled="!nom || quotas.err"
            :label="$t('valider')" @click="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-sticky position="top-left" :class="dkli(0) + ' box'" :offset="pow === 1 ? [0,25] : [0,0]">
      <div style="width:100vw; position:relative">
      <div class="largeur40 br1" style="overflow:auto;height:12.5rem">
        <div style="position:relative">
          <q-btn v-if="pow===2 && ligne && ligne.id" class="q-ml-xs" size="md" dense color="primary" 
            style="position:absolute;top:0;right:2px"
            :label="$t('detail')" icon-right="open_in_new" @click="pageTranche"/>
          <detail-tribu class="q-pa-xs" v-if="ligne" :ligne="ligne" :henrem="10"/>
        </div>
        <q-toolbar class="largeur40 bg-secondary text-white" 
          style="position:absolute;bottom:0;left:0">
          <q-toolbar-title class="titre-md">{{$t('ESltr')}}</q-toolbar-title>          
          <q-btn v-if="pow===2" size="md" dense color="primary" 
            :label="$t('PTnv')" @click="ouvrirnt"/>
        </q-toolbar>
      </div>
      </div>
    </q-page-sticky>

  </q-page>
</template>

<script>
import { ref, onMounted, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import TuileCnv from '../components/TuileCnv.vue'
import DetailTribu from '../components/DetailTribu.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { edvol, dkli } from '../app/util.mjs'
import { ID, UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouvelleTribu, GetTribu, AboTribuC, GetSynthese } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageEspace',

  props: { ns: Number },
  components: { DetailTribu, ChoixQuotas, TuileCnv },

  computed: {
  },

  methods: {
    cell (n) { return 'col-1 font-mono text-center' + (!n ? '' : ' bg-yellow-3 text-black text-bold')},
    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },

    ouvrirnt () { 
      this.nom = ''
      this.quotas = { q1: 1, q2: 1, min1: 0, min2: 0, max1: 9999, max2: 9999, err: false }
      this.ovnt()
    },
    async creer () {
      await new NouvelleTribu().run(this.nom || '', this.quotas.q1, this.quotas.q2)
      MD.fD()
    },

    async lgCourante (lg) {
      if (this.pow === 2) {
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
      await this.getTr(this.ligne.id)
      this.ui.setPage('tranche')
    }
  },

  data () {
    return {
      nom: '',
      quotas: null
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
    const aSt = stores.avatar
    const session = stores.session
    const pow = session.pow

    const ligne = ref(null)

    const fSt = stores.filtre
    const ui = stores.ui
    const synth = ref() // Synthese de l'espace
    const filtre = ref(fSt.tri.espace)

    const ct = { f: 0, m: 1 }

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

    function comp (x, y) {
      if (!x.id) return -1
      if (!y.id) return 1
      const a = x[ct.f]
      const b = y[ct.f]
      return a > b ? ct.m : (a < b ? -ct.m : 0) 
    }

    function trier () {
      const fv = filtre.value
      ct.f = fx[fv][0]
      ct.m = fx[fv][1]
      synth.value.sort(comp)
      // synth.value.forEach(lg => { console.log(lg.id, lg.q1)})
    }

    async function refreshSynth () {
      const s = await new GetSynthese().run(ns.value)
      synth.value = s.atr
    }

    function resetCourant () {
      if (aSt.tribuC) {
        synth.value.forEach(s => { if (s.id === session.tribuCId) ligne.value = s })
      } else {
        ligne.value = synth.value[0] // ligne de synthèse courante initiale
      }  
    }

    onMounted(async () => {
      await refreshSynth()
      trier()
      resetCourant()
    })

    if (pow === 2) aSt.$onAction(({ name, args, after }) => {
      after(async (result) => {
        /* si la ligne courante correspond à une tribu qui vient
        d'être chargée, on fait repointer cette ligne sur le synth de cette tribu */
        if (name === 'setTribu' || name === 'setCompta') {
          await refreshSynth()
          trier()
          resetCourant()
        }
      })
    })

    fSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTri' && args[0] === 'espace') {
          filtre.value = args[1].value
          trier()
          resetCourant()
        }
      })
    })

    const nt = ref(false)
    function ovnt () { MD.oD(nt)}

    return {
      refreshSynth, // force le rechargement de Synthese (qui n'est pas synchronisé)
      synth, // Syntheses de l'espace
      ligne, // ligne courante affichée
      MD, ID, nt, ovnt,
      aSt, session, pow, ui, dkli
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
.sep2
  margin-top: 13rem
.sep1
  margin-top: 14rem
.br1
  border-right: 1px solid $grey-7
</style>
