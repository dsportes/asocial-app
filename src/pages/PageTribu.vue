<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div v-if="session.estSponsor"> <!-- Parrainer un nouveau compte -->
      <q-btn class="q-ml-sm" size="md" icon="person_add" no-caps
        :label="$t('P10nvp')" color="warning" dense @click="ouvrirSponsoring"/>
      <bouton-help class="q-ml-sm" page="page1"/>
    </div>

    <apercu-tribu class="q-py-sm" :id="session.tribuCId" :idx="0" :edit="ed"/>

    <q-separator color="orange" class="q-my-md"/>

    <q-btn v-if="session.estComptable" class="q-mb-md" size="md" flat dense color="primary" 
      :label="$t('PTnvc')" @click="ouvrirSponsoring"/>

    <div v-if="!aSt.ptLcFT.length" class="col-auto titre-lg text-italic">
      {{$t('PTcvide', [aSt.ptLc.length])}}
    </div>

    <q-card v-if="aSt.ptLcFT.length">
      <div v-for="(c, idx) in aSt.ptLcFT" :key="c.na.id">
        <q-expansion-item dense switch-toggle-side group="g1" :class="dkli(idx)">
          <template v-slot:header>
            <div class="row full-width items-center justify-between">
              <div class="row items-center">
                <div>
                  <img v-if="c.na.id === session.compteId" class="photomax" :src="aSt.compte.photo" />
                  <span v-else>
                    <img v-if="pSt.estPeople(c.na.id)" class="photomax" :src="pSt.photo(c.na.id)" />
                    <img v-else class="photomax" :src="cfg.iconAvatar"/>
                  </span>
                </div>
                <div v-if="c.na.id === session.compteId" class="titre-md q-ml-sm">{{c.na.nom}} [{{$t('moi')}}]</div>
                <div v-else class="titre-md q-ml-sm">{{c.na.nomc}}</div>
              </div>
              <q-btn class="q-ml-md" icon="open_in_new" size="md" color="primary" dense @click.stop="courant(c)"/>
            </div>
          </template>

          <div :class="'q-ml-lg row items-start ' + dkli(idx)">
            <div class="column">
              <!-- C'est LE titulaire du compte -->
              <apercu-avatar v-if="c.na.id === session.compteId" :na="c.na" :idx="idx"/>
              <div v-else>
                <!-- C'est un compte connu en tant que people, chat engagé, 
                membre d'un groupe, sponsor de la tribu du compte-->
                <apercu-people v-if="pSt.estPeople(c.na.id)" :id="c.na.id" :idx="idx"/>
                <!-- Sinon c'est un compte lambda, pas connu comme people ... -->
                <apercu-compte v-else :elt="c" :idx="idx"/>
              </div>

              <apercu-notif class="q-my-xs" 
                :notif="c.notif" :na-tribu="aSt.tribu2CP.na" :na-cible="c.na" :idx="idx"/>

              <div v-if="c.sp" class="titre-md text-bold text-warning">{{$t('PTsp')}}</div>

              <div v-if="vis(c)" class="q-mb-xs row largeur40 items-center">
                <quotas-vols :vols="c" />
                <q-btn v-if="session.estSponsor || session.estComptable" size="sm" class="q-ml-lg"
                    icon="settings" :label="$t('gerer')" dense color="primary" @click="voirCompta(c)"/>
              </div>

            </div>
          </div>
        </q-expansion-item>
      </div>
    </q-card>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <q-dialog v-model="nvsp" persistent full-height>
      <nouveau-sponsoring :close="fermerSponsoring" :tribu="aSt.tribuC || aSt.tribu"/>
    </q-dialog>

    <!-- Fiche people détaillée 
    <q-dialog v-model="fipeople" persistent full-height>
      <panel-people :close="fermerFipeople"/>
    </q-dialog>
    -->

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
    <q-dialog v-model="cptdial" persistent full-height>
      <q-card style="width: 80vw !important;">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="cptdial = false"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [ccna.nomc])}}</q-toolbar-title>
      </q-toolbar>
      <panel-compta style="margin:0 auto"/>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2, Compteurs } from '../app/api.mjs'
import { edvol } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuTribu from '../components/ApercuTribu.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuCompte from '../components/ApercuCompte.vue'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
// import PanelPeople from '../dialogues/PanelPeople.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'
import PanelCompta from '../components/PanelCompta.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { GetCompteursCompta, SetAttributTribu2 } from '../app/operations.mjs'

export default {
  name: 'PageTribu',

  components : { BoutonHelp, QuotasVols, /*PanelPeople,*/ ApercuAvatar, ApercuPeople, PanelCompta, 
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
    fermerFipeople () { this.ui.detailspeople = false },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    type (na) {
      if (this.aSt.estAvatar(na.id)) return 1
      if (this.pSt.estPeople(na.id)) return 2
      return 3
    },
    async voirCompta (c) {
      this.ccid = c.na.id
      this.ccna = c.na
      await new GetCompteursCompta().run(c.na)
      this.cptdial = true
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
    async validerq () {
      await new SetAttributTribu2().run(this.aSt.tribuC.id, 
        this.quotas.c.na, 'quotas', [this.quotas.q1, this.quotas.q2])
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
        this.ui.detailspeople = true
      } else if (t === 3) {
        await new GetCompteursCompta().run(c.na)
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
    const cfg = stores.config
    const aSt = stores.avatar
    const pSt = stores.people
    const ui = stores.ui
    
    return {
      session,
      aSt,
      pSt,
      cfg,
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
