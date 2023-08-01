<template>
  <q-page class="column">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div class="sep2"/>

    <div v-for="(c, idx) in aSt.ptLcFT" :key="c.id">
      <q-expansion-item dense switch-toggle-side group="g1" :class="dkli(idx) + ' largeur40'">
        <template v-slot:header>
          <div class="row full-width items-center justify-between">
            <div class="row items-center">
              <div>
                <img v-if="c.id === session.compteId" class="photomax" :src="aSt.compte.photo" />
                <span v-else>
                  <img v-if="pSt.estPeople(c.id)" class="photomax" :src="pSt.photo(c.id)" />
                  <img v-else class="photomax" :src="cfg.iconAvatar"/>
                </span>
              </div>

              <div class="titre-md q-ml-sm">{{nomc(c)}}
                <span v-if="type(c)===1" class="q-ml-sm">[{{$t('moi')}}]</span>
                <span v-if="c.nasp" class="q-ml-sm">[{{$t('sponsor2')}}]</span>
              </div>

              <q-icon size="md" v-if="c.notif" :name="ico(c)"
                :class="'q-ml-md ' + tclr(c) + ' ' + bgclr(c)"/>

            </div>
            <q-btn class="q-ml-md" icon="open_in_new" size="md" color="primary" dense @click.stop="courant(c)"/>
          </div>
        </template>

        <div class="q-ml-lg">
          <!-- C'est LE titulaire du compte !?!?!?
          <apercu-avatar v-if="c.id === session.compteId" :idav="c.id" :idx="idx"/>
          -->
          <apercu-avatar v-if="type(c)===1" :idav="c.id" :idx="idx"/>
          <apercu-people v-if="type(c)===2" :id="c.id" :idx="idx"/>
          <apercu-compte v-if="type(c)===3" :elt="c" :idx="idx"/>

          <apercu-notif class="q-my-xs" 
            :notif="c.notif" :id-compte="c.id" :id-tribu="ligne.id" :nom="nomc(c)" :idx="idx"/>

          <div v-if="c.nasp" class="titre-md text-bold text-warning">{{$t('PTsp')}}</div>

          <div v-if="vis(c)" class="q-mb-xs row justify-between">
            <quotas-vols :vols="c" />
            <q-btn v-if="pow < 4" size="sm" class="q-ml-sm btn1"
                icon="settings" :label="$t('gerer')" dense color="primary" @click="editerq(c)"/>
          </div>
          
          <div class="text-right"> <q-btn v-if="pow < 4" size="sm"
            icon="poll" :label="$t('PTcompta2')" dense color="primary" 
            @click="voirCompta(c)"/></div>
        </div>
      </q-expansion-item>
    </div>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <q-dialog v-model="nvsp" persistent full-height>
      <nouveau-sponsoring :tribu="aSt.tribuC || aSt.tribu"/>
    </q-dialog>
    
    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="edq" persistent>
      <q-card class="bs petitelargeur">
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

    <!-- Affichage des compteurs de compta du compte "courant"-->
    <q-dialog v-model="cptdial" persistent full-height>
      <q-card class="bs" style="width: 80vw !important;">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [ccnomc])}}</q-toolbar-title>
      </q-toolbar>
      <panel-compta style="margin:0 auto"/>
      </q-card>
    </q-dialog>

    <q-page-sticky position="top-left" :class="dkli(0) + ' box'" :offset="pow === 1 ? [0,25] : [0,0]">
      <div style="width:100vw; position:relative">
      <div class="largeur40 br1" style="overflow:auto;height:12.5rem">
        <detail-tribu class="q-pa-xs" :ligne="ligne" :henrem="10"/>
        <q-toolbar class="largeur40 bg-secondary text-white" 
          style="position:absolute;bottom:0;left:0">
          <q-toolbar-title class="titre-md q-ma-xs">{{$t('PTtit' + (pow === 4 ? '1' : '2'))}}</q-toolbar-title>          
          <q-btn v-if="pow < 4" size="md" dense color="primary" 
            :label="$t('PTnvc')" @click="ovnvsp"/>
        </q-toolbar>
      </div>
      </div>
    </q-page-sticky>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { dkli } from '../app/util.mjs'
import DetailTribu from '../components/DetailTribu.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuCompte from '../components/ApercuCompte.vue'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import PanelCompta from '../components/PanelCompta.vue'
import QuotasVols from '../components/QuotasVols.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'
import { GetCompteursCompta, SetQuotas } from '../app/operations.mjs'

const ic = ['check', 'report', 'alarm_on', 'lock_open', 'lock', 'close']
const txt = ['green-3', 'green-3', 'orange-9', 'negative', 'negative', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-2', 'yellow-5',  'yellow-7']

export default {
  name: 'PageTranche',
  components: { DetailTribu, ApercuNotif, ChoixQuotas, ApercuCompte, ApercuPeople,
    ApercuAvatar, PanelCompta, QuotasVols, NouveauSponsoring },

  props: { },

  computed: {
  },

  methods: {
    ico (c) { return ic[c.notif.niv || 0] },
    tclr (c) { return 'text-' + txt[c.notif.niv || 0]},
    bgclr (c) { return 'bg-' + bg[c.notif.niv || 0] },

    vis (c) { 
      return (this.pow < 4 || (c.id === this.aSt.compteId))
    },

    type (c) {
      if (this.aSt.estAvatar(c.id)) return 1
      if (this.pSt.estPeople(c.id)) return 2
      return 3
    },

    nomc (c) {
      if (this.type(c) === 1) return this.aSt.getAvatar(c.id).na.nom
      if (this.type(c) === 2) return this.pSt.getNa(c.id).nomc
      return '#' + c.id
    },

    async courant (c) { 
      this.ccid = c.id
      this.ccnomc = this.nomc(c)
      const t = this.type(c)
      if (t === 1) {
        this.session.setAvatarId(c.id)
        MD.oD('detailsavatar')
      } else if (t === 2) {
        this.session.setPeopleId(c.id)
        MD.oD('detailspeople')
      } else if (t === 3) {
        await new GetCompteursCompta().run(c.id)
        this.ovcptdial()
      }
    },

    async voirCompta (c) {
      this.ccid = c.id
      this.ccnomc = this.nomc(c)
      await new GetCompteursCompta().run(c.id)
      this.ovcptdial()
    },

    async editerq (c) {
      if (! await this.session.edit()) return
      this.quotas = { q1: c.q1, q2: c.q2, min1: 0, min2: 0, 
        max1: this.aSt.tribuC.cpt.q1 - this.aSt.tribuC.cpt.a1,
        max2: this.aSt.tribuC.cpt.q2 - this.aSt.tribuC.cpt.a2,
        c: c
        }
      this.ovedq()
    },
    
    async validerq () {
      await new SetQuotas().run(this.aSt.tribuC.id, 
        this.quotas.c.id, this.quotas.q1, this.quotas.q2)
      MD.fD()
    },

},

  data () {
    return {
      ccid: 0, // compte "courant" dans la liste
      ccnomc: '', // nom plus ou moins complet du compte "courant"
      quotas: {},
      cpt: null,
      fipeople: false
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const pSt = stores.people
    const ligne = ref()
    const pow = session.pow

    function resetCourant () { ligne.value = aSt.tribuC.synth }

    if (pow > 1) aSt.$onAction(({ name, args, after }) => {
      after(async (result) => {
        if (name === 'setTribu' || name === 'setCompta') {
          resetCourant()
        }
      })
    })

    resetCourant()

    const nvsp = ref(false)
    function ovnvsp () { MD.oD(nvsp)}
    const edq = ref(false)
    function ovedq () { MD.oD(edq)}
    const cptdial = ref(false)
    function ovcptdial () { MD.oD(cptdial)}

    return {
      session, aSt, pSt, pow,
      ligne,
      MD, nvsp, ovnvsp, edq, ovedq, cptdial, ovcptdial,
      cfg: stores.config,
      ui: stores.ui, dkli
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.sep2
  margin-top: 13rem
.br1
  border-right: 1px solid $grey-7
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  max-height: 1.5rem !important
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
