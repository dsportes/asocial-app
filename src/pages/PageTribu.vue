<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <apercu-tribu class="q-py-sm" :id="session.tribuCId" :idx="0" :edit="ed"/>

    <q-separator color="orange" class="q-my-md"/>

    <q-btn v-if="session.estComptable" class="q-mb-md" size="md" flat dense color="primary" 
      :label="$t('PTnvc')" @click="ouvrirSponsoring"/>

    <div v-if="!aSt.ptLcFT.length" class="col-auto titre-lg text-italic">
      {{$t('PTcvide', [aSt.ptLc.length])}}
    </div>

    <q-card v-if="aSt.ptLcFT.length">
      <div v-for="(c, idx) in aSt.ptLcFT" :key="c.na.id">
        <div :class="'q-mb-md row items-start ' + dkli(idx)">
          <q-btn class="col-auto" flat icon="navigate_next" size="md"
            :color="c.na.id === ccid ? 'warning' : 'primary'" @click="courant(c)"/>
          <div class="col q-pr-xs">
            <apercu-compte v-if="type(c.na)===3" :elt="c" :idx="idx"/>
            <apercu-people v-if="type(c.na)===2" :id="c.na.id" :idx="idx"/>
            <apercu-avatar v-if="type(c.na)===1" :na="c.na" :idx="idx"/>

            <div v-if="c.sp" class="titre-md text-bold text-warning">{{$t('PTsp')}}</div>

            <div v-if="vis(c)" class="q-mb-xs row largeur40 items-center">
              <quotas-vols :vols="c" />
              <q-btn v-if="session.estSponsor || session.estComptable" size="sm" class="q-ml-lg"
                  icon="settings" :label="$t('gerer')" dense color="primary" @click="editerq(c)"/>
            </div>

            <apercu-notif class="q-my-xs" :notif="c.notif" :na-cible="c.na" :idx="idx"/>

          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <q-dialog v-model="nvsp" persistent full-height>
      <nouveau-sponsoring :close="fermerSponsoring" :tribu="aSt.tribuC"/>
    </q-dialog>

    <!-- Fiche people détaillée -->
    <q-dialog v-model="fipeople" persistent full-height>
      <panel-people :close="fermerFipeople"/>
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
          :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Affichage des compteurs de compta du compte "courant"-->
    <q-dialog v-model="cptdial" persistent>
      <q-card style="width: 700px; max-width: 80vw;">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="cptdial = false"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [ccna.nomc])}}</q-toolbar-title>
      </q-toolbar>
      <panel-compta :c="aSt.ccCpt" style="margin:0 auto"/>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2, Compteurs } from '../app/api.mjs'
import { edvol, hms, $t } from '../app/util.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuCompte from '../components/ApercuCompte.vue'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import PanelPeople from '../dialogues/PanelPeople.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'
import PanelCompta from '../components/PanelCompta.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { GetCompteursCompta } from '../app/operations.mjs'

export default {
  name: 'PageTribu',

  components : { QuotasVols, PanelPeople, ApercuAvatar, ApercuPeople, PanelCompta, 
    ApercuTribu, ApercuCompte, NouveauSponsoring, ApercuNotif, ChoixQuotas  },

  computed: {
    ed () { return this.session.estComptable || this.session.estSponsor },
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    vis (c) { 
      return (this.session.estComptable || this.session.estSponsor || (c.na.id === this.aSt.compteId))
    },
    ouvrirSponsoring () { this.nvsp = true },
    fermerSponsoring () { this.nvsp = false },
    fermerFipeople () { this.fipeople = false },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    type (na) {
      if (this.aSt.estAvatar(na.id)) return 1
      if (this.pSt.estPeople(na.id)) return 2
      return 3
    },
    async editerq (c) {
      if (! await this.session.edit()) return
      this.quotas = { q1: c.q1, q2: c.q2, min1: 0, min2: 0, 
        max1: this.aSt.tribuC.cpt.q1 - this.aSt.tribuC.cpt.a1,
        max2: this.aSt.tribuC.cpt.q2 - this.aSt.tribuC.cpt.a2,
        c: c
        }
      this.edq = true
    },
    validerq () {
      // this.quotas.c -> elt mtbr de tribu2
      // TODO
      console.log(JSON.stringify(this.quotas))
      this.edq = false
    },
    async courant (c) { 
      const t = this.type(c.na)
      this.ccid = c.na.id
      this.ccna = c.na
      if (t === 1) {
        this.session.setAvatarId(c.na.id)
        this.ui.detailsavatar = true
      } else if (t === 2) {
        this.session.setPeopleId(c.na.id)
        this.fipeople = true
      } else if (t === 3) {
        const res = await new GetCompteursCompta().run(c.na.id)
        this.aSt.ccCpt = new Compteurs(res)
        this.cptdial = true
      }
    },
  },

  data () {
    return {
      ccid: 0, // compte "courant" dans la liste
      ccna: null,
      nvsp: false,
      edq: false,
      quotas: {},
      cptdial: false,
      cpt: null,
      fipeople: false
    }
  },

  setup () {
    /*
    Elément de ptLc :
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
    const aSt = stores.avatar
    const pSt = stores.people
    const ui = stores.ui
    
    return {
      session,
      aSt,
      pSt,
      ui
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
