<template>
  <q-page class="q-pa-sm">
    <div v-if="msg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{msg}}</div>

    <apercu-tribu class="q-py-sm" :id="session.tribuCId || session.tribuId" :idx="0" :edit="ed"/>

    <q-separator color="orange" class="q-my-md"/>

    <q-btn v-if="session.estComptable" class="q-mb-md" size="md" flat dense color="primary" 
      :label="$t('PTnvc')" @click="ouvrirSponsoring"/>

    <div v-if="!flc.length" class="col-auto titre-lg text-italic">
      {{$t('PTcvide', [lc.length])}}
    </div>

    <q-card v-if="flc.length">
      <div v-for="(c, idx) in flc" :key="c.na.id">
        <div :class="'row items-start ' + dkli(idx)">
          <q-btn class="col-auto" flat icon="navigate_next" size="md"
            :color="c.na.id === ccid ? 'warning' : 'primary'" @click="courant(c)"/>
          <div class="col q-pr-xs">
            <apercu-compte :na="c.na" :cv="c.cv" :idx="idx"/>
            <div v-if="session.estSponsor" class="titre-md text-bold text-warning">{{$t('PTsp')}}</div>

            <div class="q-mb-xs row largeur30 items-center">
              <div class="col-1">
                <q-btn v-if="session.estSponsor || session.estComptable" size="sm" icon="edit" 
                  dense color="primary" @click="editerq(c)"/>
              </div>
              <div class="col-5 titre-sm">{{$t('PTq12')}}</div>
              <div class="col-3 text-center font-mono">{{c.q1}} - {{ed1(c.q1)}}</div>
              <div class="col-3 text-center font-mono">{{c.q2}} - {{ed2(c.q2)}}</div>
            </div>

            <apercu-blocage :blocage="c.blocage" :edit="session.estComptable" :idx="idx"
              :na-tr="t.na" :bl-tr="t.blocage" :na-co="c.na"/>
            <apercu-notif class="q-my-xs" :src="c" :na-tr="t.na" :edit="session.estComptable" :idx="idx"/>
            <apercu-notif class="q-my-xs" :src="c" :na-tr="t.na" sponsor :edit="session.estSponsor" :idx="idx"/>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <q-dialog v-model="nvsp" persistent full-height>
      <nouveau-sponsoring :close="fermerSponsoring" :tribu="t"/>
    </q-dialog>

    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="edq" persistent>
      <q-card class="petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="edq = false"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" />
        <q-card-actions>
          <q-btn :disabled="quotas.err" dense size="md" color="primary" icon="check" 
          :label="$t('ok')" @click="validerq(quotas.c)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol, hms, $t } from '../app/util.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ApercuBlocage from '../components/ApercuBlocage.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuCompte from '../components/ApercuCompte.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'

export default {
  name: 'PageTribu',

  components : { ApercuTribu, ApercuCompte, NouveauSponsoring, ApercuBlocage, ApercuNotif, ChoixQuotas  },

  computed: {
    ed () { return this.session.estComptable || this.session.estSponsor },
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    courant (c) { this.ccid = c.na.id },
    ouvrirSponsoring () { this.nvsp = true },
    fermerSponsoring () { this.nvsp = false },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    async editerq (c) {
      if (! await this.session.edit()) return
      this.quotas = { q1: c.q1, q2: c.q2, min1: 0, min2: 0, 
        max1: this.t.cpt.q1 - this.t.cpt.a1,
        max2: this.t.cpt.q2 - this.t.cpt.a2,
        c: c
        }
      this.edq = true
    },
    validerq (c) {
      console.log(JSON.stringify(this.quotas))
    }
  },

  data () {
    return {
      ccid: 0, // compte "courant" dans la liste
      nvsp: false,
      edq: false,
      quotas: {}
    }
  },

  setup () {
    /*
    tc = true si la page affiche la tribu du compte. 
      - false pour le cas du Comptable qui inspecte une tribu "courante" quelconque,
      laquelle ne change pas d'id tant que la page est affichée
    L'id de la tribu du compte est supposée inchangée tant que la page est ouvert:
      - on ignore une synchronisation de changement de tribu pendant ce lapse de temps.

    Elément de lc:
    - `na` : du membre crypté par la clé de la tribu.
    - `sp` : si `true` / présent, c'est un sponsor.
    - `q1 q2` : quotas du compte (redondance dans l'attribut `compteurs` de `compta`)
    - `blocage` : blocage de niveau compte, crypté par la clé de la tribu.
    - 'gco gsp' : gravités des notifco et notifsp.
    - `notifco` : notification du comptable au compte.
    - `notifsp` : notification d'un sponsor au compte.
    - `cv` : `{v, photo, info}`, carte de visite du compte.
    */

    const session = stores.session
    const avStore = stores.avatar
    const fStore = stores.filtre

    const tc = !session.tribuCId || session.tribuCId === session.tribuId // true si c'est la tribu du compte
    const t = ref(tc ? avStore.tribu : avStore.getTribu(session.tribuCId)) // tribu
    const lc = ref() // liste de comptes
    const flc = ref() // liste des comptes filtrée et triée
    const msg = ref('') // message fugitif après réaffichage
    
    function getlc () {
      const x = tc ? avStore.tribu2 : avStore.tribu2C
      return x ? x.listeComptes() : []
    }

    lc.value = getlc()

    if (tc) {
      avStore.$onAction(({ name, args, after }) => {
        after((result) => {
          if (name === 'setTribu') {
            t.value = avStore.tribu
          }
        })
      })
    } else {
      avStore.$onAction(({ name, args, after }) => {
        after((result) => {
          if (name === 'setTribuC') {
            t.value = avStore.getTribu(session.tribuCId)
          }
        })
      })
    }
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribu2') {
          lc.value = getlc()
          filtrer(); trier()
        }
      })
    })

    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setFiltre' && args[0] === 'tribu2') {
          filtrer(); trier()
        }
      })
    })
    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTri' && args[0] === 'tribu2') {
          trier()
        }
      })
    })

    function f0 (a,b) { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0) }

    const fnt = [f0]
    function trier () {
      const f = fStore.tri.tribu2
      if (!f) return
      const x = []; flc.value.forEach(t => { x.push(t) })
      x.sort(fnt[f])
      flc.value = x
      fmsg()
    }

    function filtrer () {
      const f = fStore.filtre.tribu2
      if (!f) { flc.value = lc.value; return }
      const r = []
      for (const c of lc.value) {
        r.push(c)
      }
      flc.value = r
      fmsg()
    }

    function fmsg () {
      const r = flc.value
      msg.value = hms(new Date(), true) + ' / ' + $t('items', r.length, { count: r.length })
      setTimeout(() => {
        msg.value = ''
      }, 1000)
    }

    filtrer()
    trier()

    return {
      session,
      tc, t, lc, flc,
      msg
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
