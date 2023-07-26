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
    <!--div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div-->

    <div :class="pow === 1 ? 'sep' : 'sep2'"/>

    <div :class="dkli(idx) + ' column cursor-pointer zone' + (ligne && (ligne.id === lg.id) ? ' courant' : '')" 
      v-for="(lg, idx) in synth" :key="lg.id" @click=lgCourante(lg)>
      <div class="full-width row"> <!-- ligne 1 -->
        <div class="col-3 fs-md">
          <span v-if="!lg.id">{{$t('total')}}</span>
          <span v-else>#{{ID.court(lg.id)}}
            <span v-if="pow === 2" class= "q-ml-sm">{{lg.info}}</span>
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

      <div class="full-width row"> <!-- ligne 2 -->
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

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="nt" persistent>
      <q-card class="bs moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <div class="q-pa-m">
          <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:append>
              <q-btn dense icon="check" :label="$t('ok')" @click="valider" color="warning"/>
            </template>
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
      <div class="column" style="width:100vw">
        <div style="position:relative">
          <q-btn v-if="pow===2 && ligne && ligne.id" class="q-ml-xs" size="md" dense color="primary" 
            style="position:absolute;top:0;right:0"
            :label="$t('detail')" icon-right="open_in_new" @click="pageTranche"/>
          <detail-tribu v-if="ligne" :ligne="ligne" :henrem="pow === 1 ? 8 : 10"/>
        </div>
        <q-toolbar class="full-width bg-secondary text-white">
          <q-toolbar-title class="titre-md">{{$t('ESltr')}}</q-toolbar-title>          
          <q-btn v-if="pow===2" size="md" dense color="primary" 
            :label="$t('PTnv')" @click="ouvrirnt"/>
        </q-toolbar>
      </div>
    </q-page-sticky>

  </q-page>
</template>

<script>
import { ref, onMounted, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import DetailTribu from '../components/DetailTribu.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { edvol } from '../app/util.mjs'
import { ID, UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouvelleTribu, GetTribu, AboTribuC, GetSynthese } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageEspace',

  props: { ns: Number },
  components: { DetailTribu, ChoixQuotas },

  computed: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
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
      if (this.pow === 2 && (lg.ntr1 || lg.ntr2)) {
        const t = await this.getTr(id)
        this.ligne = t.synth
      } else {
        this.ligne = lg
      }
    },

    async getTr (id) {
      if (this.pow === 1) return null
      if (this.session.tribuCId === id) return this.aSt.tribuC
      if (this.session.tribuId !== id) return this.aSt.tribu
      let t = this.aSt.getTribu(id)
      if (!t) { 
        t = await new GetTribu().run(id, true) // true: abonnement
      } else {
        if (session.fsSync) await new AboTribuC().run(id)
      }
      this.aSt.setTribuC(t)
      return t
    },

    async pageTranche (id) { // Comptable seulement
      await this.getTr(id)
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
      const a = x[ct.f]
      const b = x[ct.f]
      return a > b ? -ct.m : (a < b ? ct.m : 0) 
    }

    function trier () {
      ct.f = fx[filtre.value][0]
      ct.m = fx[filtre.value][1]
      synth.value.sort(comp)
      // synth.value.forEach(lg => { console.log(lg.id, lg.q1)})
    }

    async function refreshSynth () {
      const s = await new GetSynthese().run(ns.value)
      synth.value = s.atr
      trier()
    }

    onMounted(async () => {
      await refreshSynth()
      trier()
      if (aSt.tribuC) {
        synth.value.forEach(s => { if (s.id === session.tribuCId) ligne.value = s })
      } else {
        ligne.value = synth.value[0] // ligne de synthèse courante initiale
      }  
    })

    if (pow === 2) aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setCompta') setInfoMap()
        /* si la ligne courante correspond à une tribu qui vient
        s'être chargée, on fait repointer cette ligne sur le synth de cette tribu */
        if (name === 'setTribu' && ligne.value.id === args[0]) {
          const t = aSt.getTribu(ligne.value.id)
          ligne.value = t.synth
        }
      })
    })

    watch(() => filtre.value, (ap, av) => {
        trier()
      }
    )

    const nt = ref(false)
    function ovnt () { MD.oD(nt)}

    return {
      refreshSynth, // force le rechargement de Synthese (qui n'est pas synchronisé)
      synth, // Syntheses de l'espace
      ligne, // ligne courante affichée
      MD, ID, nt, ovnt,
      aSt, session, pow, ui
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
.sep
  margin-top: 11rem
.sep2
  margin-top: 12rem
</style>
