<!--
Source principale : Synthese
Depuis PageAdmin par l'administrateur: ns est donné par PageAdmin
- les "tribus / tranche d'allocation de quotas" n'ont PAS de nom
- les notifs tribu ne sont pas accessibles, seulement leurs gravités
- la création d'une nouvelle tribu n'est pas possible
- zoom impossible sur une tribu
Depuis un Comptable: ns est celui de la session
- les "tribus / tranche d'allocation de quotas" ont un nom / info
- les notifs tribu sont accessibles
- la création d'une nouvelle tribu est possible
- zoom possible sur une tribu
- source secondaire de données: compta.act
-->
<template>
  <q-page class="column q-pl-xs q-mr-sm">
    <!--div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div-->



      <q-btn class="q-my-sm" size="md" flat dense color="primary" 
        :label="$t('PTnv')" @click="ouvrirnt"/>

    <div v-if="!aSt.ptLtFT.length" class="largeur40 maauto q-my-md titre-lg text-italic">
      {{$t('PTvide', [aSt.getTribus.length])}}
    </div>

    <q-card class="largeur40 maauto" v-if="aSt.ptLtFT.length">
      <div v-for="(tribu, idx) in aSt.ptLtFT" :key="tribu.id">
        <q-expansion-item dense switch-toggle-side group="g1" :class="'q-my-xs ' + dkli(idx)">
          <template v-slot:header>
            <div class="q-ml-md row full-width justify-between items-center">
              <div class="titre-md">{{tribu.na.nom}}</div>
              <q-btn class="q-ml-md" icon="open_in_new" size="md" color="primary" dense @click.stop="courant(tribu.id)"/>
            </div>
          </template>
          <apercu-tribu class="q-ml-lg" :id="tribu.id" :idx="idx" edit/>
        </q-expansion-item>
      </div>
    </q-card>

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

    <q-page-sticky position="top-left" :class="dkli(0) + ' box'" :offset="[0,0]">
      <div class="column" style="width:100vw">

      </div>
    </q-page-sticky>

  </q-page>
</template>

<script>
import { ref, onMounted, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { $t, afficherDiag, edvol } from '../app/util.mjs'
import { ID, UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouvelleTribu, GetTribu, GetSynthese } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageEspace',

  props: { ns: Number },
  components: { ApercuTribu, ChoixQuotas },

  computed: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

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

    async courant (id) {
      const t = await new GetTribu().run(id, true)
      this.aSt.setTribuC(t)
      this.ui.setPage('tribu')
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
  atr[0] est la somme des atr[1..N] : calculé sur compile (pas stocké)
  */
  setup (props) {
    const ns = toRef(props, 'ns')
    const aSt = stores.avatar
    const session = stores.session
    const admin = ref(session.estAdmin)
    const synt = ref()
    const ids = ref()
    const alertes = ref()
    const txq = ref(80)
    const txv = ref(80)
    const infoMap = ref()

    async function refreshSynt () {
      synt.value = await new GetSynthese().run(ns.value)
      setAlertes()
    }

    function setAlertes () {
      const lids = []
      const lals = []
      for (let i = 1; i < synt.value.atr.length; i++) {
        const e = synt.value.atr[i]
        if (!e || e.vide) continue
        const id = ID.long(i, ns.value)
        e.id = id
        lids.push(id)
        const nc = e.ntr2 > 0
        const ni = e.nco2 > 0
        const aq1 = (e.a1 * 100 / e.q1) > txq.value
        const aq2 = (e.a2 * 100 / e.q2) > txq.value
        const av1 = (e.v1 * 100 / e.a1) > txv.value
        const av2 = (e.a1 * 100 / e.a2) > txv.value
        if (nc || ni || aq1 || aq2 || av1 || av2) {
          lals.push({id, nc, ni, aq1, aq2, av1, av2})
        }
      }
      session.value.fmsg(1, $t('PTraf'))
    }

    function setInfoMap () {
      const m = new Map()
      if (!admin.value) {
        const atr = aSt.compta.atr
        for (let i = 1; i < atr.length; i++) {
          const e = atr[i]
          if (e && !e.vide)
            m.set(ID.long(i, ns.value), {info: e.info || ('#' + i), clet: e.clet})
        }
      }
      infoMap.value = m
    }

    function info (id) { return infoMap.value.get(id).info }

    function clet (id) { return infoMap.value.get(id).clet }

    onMounted(async () => {
      await refreshSynt()
    })

    if (!admin.value) aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setCompta') setInfoMap()
      })
    })

    watch(() => txq.value, (ap, av) => {
        setAlertes()
      }
    )

    watch(() => txv.value, (ap, av) => {
        setAlertes()
      }
    )

    refreshSynt()
    setInfoMap()

    const nt = ref(false)
    function ovnt () { MD.oD(nt)}

    return {
      admin, refreshSynt, info, clet, txq, txv, synt, ids, alertes,
      MD, ID, nt, ovnt,
      aSt, session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
$hb: 18rem
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
.box
  width: 100vw
  height: $hb
  overflow: hidden
.sep
  margin-top: $hb
</style>
