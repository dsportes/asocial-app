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
  <q-page>
    <div v-if="pow===2" class="row height-3 overflow-hidden-y">
      <q-btn class="col-auto q-my-sm fs-md btn2" size="md" dense color="primary" 
        :label="$t('PTnv')" @click="ouvrirnt"/>

      <q-select class="col q-ml-md largeur20" borderless v-model="optionA" :options="options" dense />
      <div class="col-auto q-ml-sm column">
        <q-btn dense size="sm" color="primary" :disable="!chgOptionA"
          icon="undo" @click="undoOptionA"/>
        <q-btn dense size="sm" color="warning" :disable="!chgOptionA"
          icon="check" @click="saveOptionA"/>
      </div>
    </div>
    <div v-else class="height-3"/>

    <div class="q-mx-xs" 
      v-for="(lg, idx) in synth" :key="lg.id" @click="lgCourante(lg)">
      <q-expansion-item switch-toggle-side expand-separator dense group="trgroup">
        <template v-slot:header>
          <div :class="dkli(idx) + ' row full-width'">
            <div class="col-3 fs-md">
              <span v-if="!lg.id">{{$t('total')}}</span>
              <span v-else>#{{ID.court(lg.id)}}
                <span v-if="pow === 2" class= "q-ml-sm">{{aSt.compta.infoTr(lg.id)}}</span>
              </span>
            </div>
            <div class="col-4">
              {{$t('PEnbc', lg.nbc, { count: lg.nbc })}}, {{$t('PEsp', lg.nbsp, { count: lg.nbsp })}}
            </div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.qc}}<br/>{{lg.pcac}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q1}}<br/> {{lg.pca1}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q2}}<br/> {{lg.pca2}}%</div>
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
        <div class="q-ml-xl q-mb-lg">
          <div class="row q-gutter-sm">
            <tuile-cnv type="qc" :src="lg" occupation/>
            <tuile-cnv type="q1" :src="lg" occupation/>
            <tuile-cnv type="q2" :src="lg" occupation/>
            <tuile-notif :src="lg" :total="idx === 0" occupation/>
          </div>
          <div v-if="idx !== 0" class="q-my-xs">
            <apercu-notif2 :editable="session.pow < 4" :notif="notif" :type="1" 
              :ctx="{ idt: lg.id }"/>
          </div>
          <div v-if="pow === 2 && idx !== 0" class="row q-mt-xs q-gutter-xs">
            <q-btn class="fs-md btn2" size="sm" dense
              color="primary" :icon="lg.info ? 'edit' : 'add'" 
              :label="$t('PEedn')" @click="editer"/>
            <q-btn size="sm" class="fs-md btn2"
              icon="settings" :label="$t('PEabo')" dense color="primary" @click="editerq"/>
            <q-btn v-if="lg.id" class="fs-md btn2" size="sm" dense color="primary" 
              :label="$t('detail')" icon-right="open_in_new" @click="pageTranche"/>
          </div>
        </div>
      </q-expansion-item>
    </div>

    <!-- Edition de l'info attachée à une tribu -->
    <q-dialog v-model="ui.d.PEedcom" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTinfo')}}</q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm">
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
    <q-dialog v-model="ui.d.PEedq" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqut')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions>
          <q-btn :disabled="quotas.err" dense size="md" color="primary" 
            icon="check" :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="ui.d.PEnt" persistent>
      <q-card class="bs moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <div class="q-pa-sm">
          <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
        <choix-quotas :quotas="quotas" />
        <q-card-actions>
          <q-btn flat dense color="warning" icon="close" :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn flat dense color="primary" icon="check" :disabled="!nom || quotas.err"
            :label="$t('valider')" @click="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuNotif2 from '../components/ApercuNotif.vue'
import { SetNotifT } from '../app/operations.mjs'
import { dkli, $t } from '../app/util.mjs'
import { ID } from '../app/api.mjs'
import { SetEspaceOptionA, NouvelleTribu, GetTribu, AboTribuC, GetSynthese, SetAtrItemComptable } from '../app/operations.mjs'

export default {
  name: 'PageEspace',

  props: { ns: Number },
  components: { ChoixQuotas, TuileCnv, TuileNotif, ApercuNotif2 },

  computed: {
  },

  methods: {

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
      if (this.pow === 2) {
        const t = await this.getTr(lg.id)
        this.ligne = t.synth
        this.notif = t.notif
      } else {
        this.ligne = lg
        this.notif = null
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
    const notif = ref(null)
    const optionA = ref(null)
    const chgOptionA = ref(false)
    const options = [
      { label: $t('PTopt0'), value: 0 },
      { label: $t('PTopt1'), value: 1 },
      { label: $t('PTopt2'), value: 2 },
    ]

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
        synth.value.forEach(s => { 
          if (s.id === session.tribuCId) {
            ligne.value = s
          }
        })
      } else {
        ligne.value = synth.value[0] // ligne de synthèse courante initiale
      }  
    }

    function setOptionA (e) {
      optionA.value = options[e.opt]
      chgOptionA.value = false
    }

    function undoOptionA () {
      optionA.value = options[session.espace.opt]
    }

    watch(() => optionA.value, (ap, av) => {
        chgOptionA.value = session.espace.opt !== ap.value
      }
    )

    async function saveOptionA () {
      await new SetEspaceOptionA().run(optionA.value.value)
    }

    onMounted(async () => {
      setOptionA(session.espace)
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
        if (name === 'setTribu' && args[0].id === ligne.value.id) {
          notif.value = args[0].notif
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

    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setEspace') {
          const e = args[0]
          setOptionA(e)
        }
      })
    })

    return {
      refreshSynth, // force le rechargement de Synthese (qui n'est pas synchronisé)
      synth, // Syntheses de l'espace
      notif, ligne, // ligne courante affichée
      ID,
      aSt, session, pow, ui, dkli,
      optionA, options, saveOptionA, undoOptionA, chgOptionA
    }
  }

}
</script>
<style lang="css">
.q-item__section--avatar { min-width: 0 !important; }
</style>
<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
.btn2
  max-height: 1.5rem
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
