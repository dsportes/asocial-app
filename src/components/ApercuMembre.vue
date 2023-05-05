<template>
  <div>
    <div :class="dkli(idx)">
      <apercu-genx v-if="people" :na="mb.na" :cv="mb.cv" :ids="mb.ids" :idx="idx" detail-people/>

      <div v-else class="row justify-between">
        <div>
          <span class="titre-lg text-bold text-primary">{{$t('moi2', [mb.na.nom])}}</span>
          <span class="q-ml-lg font-mono fs-sm">{{'#' + mb.na.id}}</span>
        </div>
        <bouton-membre v-if="!nopanel" :eg="eg" :im="mb.ids" btn/>
      </div>

      <div>
        <span class="fs-md q-mr-md">{{$t('statutmb' + st)}}</span>
        <q-btn dense size="sm" color="primary" icon="settings" @click="changeSt" :label="$t('AMchanger')"/>
      </div>

      <!-- Info à propos du groupe -->
      <div v-if="!people" class="q-py-sm">
        <div v-if="mb.info" class="titre-md">{{$t('AMinfo')}}</div>
        <show-html v-if="mb.info" class="bord" maxh="5rem" :texte="mb.info" zoom
          @edit="editInfo"/>
        <div v-else class="row">
          <div class="col fs-md text-italic">({{$t('AMnoinfo')}})</div>
          <q-btn class="col-auto btn1" size="sm" dense icon="edit" color="primary" @click="editInfo"/>
        </div>
      </div>

      <!-- Mots clés attachés au groupe par un avatar du compte -->
      <div v-if="!people && mapmc"> 
        <apercu-motscles @ok="changeMc" :idx="idx" du-compte :du-groupe="0"
          :mapmc="mapmc" edit :src="mb.mc || new Uint8Array([])"/>
      </div>

      <div class="fs-md">
        <span v-if="mb.ids === 1" class="q-mr-xs">{{$t('AMfond')}}</span>
        <span v-if="mb.idi && eg.groupe.ast[mb.idi]" class="q-mr-xs">
          {{$t('AMct1', [mbidi ? mbidi.na.nomc : '?'])}}</span>
        <span v-if="mb.idi && !eg.groupe.ast[mb.idi]" class="q-mr-xs">{{$t('AMct2', [mb.idi])}}</span>
      </div>

      <div class="row titre-md text-italic">
        <div class="col-4 text-center">{{$t('AMddi')}}</div>
        <div class="col-4 text-center">{{$t('AMdda')}}</div>
        <div class="col-4 text-center">{{$t('AMdfa')}}</div>
      </div>
      <div class="row fs-md font-mono">
        <div class="col-4 text-center">{{ddi}}</div>
        <div class="col-4 text-center">{{dda}}</div>
        <div class="col-4 text-center">{{dfa}}</div>
      </div>
    </div>

    <!-- Dialogue d'édition de l'info pour un membre avatar du compte -->
    <q-dialog v-model="infoedit" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('AMinfo')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="MD.fD"/>
        </q-toolbar>
        <editeur-md class="height-10"
          :texte="mb.info || ''" editable modetxt :label-ok="$t('OK')" @ok="infook"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de changement de statut -->
    <q-dialog v-model="chgSt" persistent>
      <q-card class="bs petitelargeur column">
        <q-card-section>
          <div class="titre-lg q-my-sm text-center">{{mb.na.nomc}}</div>
          <div class="titre-lg q-my-sm text-center">{{$t('statutmb' + st)}}</div>
          <div class="column justify-center">
          <q-btn v-if="st===10" class="q-my-xs text-center" no-caps dense color="warning" 
            :label="$t('action1')" @click="action=1"/>

          <q-btn v-if="st>=20 && st<=22" class="q-my-xs text-center" no-caps dense color="warning" 
            :label="$t('action2')" @click="action=2"/>
          <q-btn v-if="st>=20 && st<=22" class="q-my-xs text-center" no-caps dense color="warning" 
            :label="$t('action2b')" @click="action=1"/>
          <q-btn v-if="st===21 || st===22" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action20')" @click="action=20"/>
          <q-btn v-if="st===20 || st===22" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action21')" @click="action=21"/>
          <q-btn v-if="st===20 || st===21" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action22')" @click="action=22"/>

          <q-btn v-if="st>=30 && st<=32" class="q-my-xs text-center" no-caps dense color="warning" 
            :label="$t('action3')" @click="action=3"/>
          <q-btn v-if="st>=30 && st<=32" class="q-my-xs text-center" no-caps dense color="warning" 
            :label="$t('action3b')" @click="action=1"/>
          <q-btn v-if="st===31 || st===32" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action30')" @click="action=30"/>
          <q-btn v-if="st===30 || st===32" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action31')" @click="action=31"/>
          <q-btn v-if="st===30 || st===31" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action32')" @click="action=32"/>

          <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="warning" 
            :label="$t('action1')" @click="action=1"/>
          <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action40')" @click="action=40"/>
          <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action41')" @click="action=41"/>
          <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="primary" 
            :label="$t('action42')" @click="action=42"/>
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn class="q-pa-xs q-mr-sm" dense :label="$t('renoncer')" color="warning" icon="close" @click="closeSt"/>
          <bouton-confirm :actif="action!==0" :confirmer="actionSt"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { ref } from 'vue'

import { afficherDiag, dhcool } from 'src/app/util.mjs'
import stores from '../stores/stores.mjs'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonMembre from './BoutonMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import ApercuMotscles from './ApercuMotscles.vue'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuMembre',

  props: { 
    mb: Object,
    eg: Object,
    mapmc: Object,
    idx: Number, 
    people: Boolean,
    nopanel: Boolean // Ne pas mettre le bouton menant à PanelMembre
  },

  components: { BoutonConfirm, ApercuGenx, ShowHtml, EditeurMd, ApercuMotscles, BoutonMembre },

  computed: {
    photo () { return this.mb && this.mb.cv && this.mb.cv.photo ? this.mb.cv.photo : this.photoDef },
    info () { return this.mb && this.mb.cv ? this.mb.cv.info || '' : '' },
    st () { return this.eg.groupe.ast[this.mb.ids] },
    ddi () { return this.mb.ddi ? dhcool(this.mb.ddi) : '-' },
    dda () { return this.mb.dda ? dhcool(this.mb.dda) : '-' },
    dfa () { return this.mb.dfa ? dhcool(this.mb.dfa) : '-' },
    mbidi () { return this.gSt.getMembre(this.mb, this.mb.idi)},
  },

  data () { return {
    action: 0
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async changeSt () {
      if (!await this.session.edit()) return
      const an = this.eg.estAnim
      if (!an) {
        await afficherDiag(this.$t('AMpasanst1'))
        return
      }
      if (an && this.st === 32 && !this.mb.estAc) {
        await afficherDiag(this.$t('AMpasanst2'))
        return
      }
      this.action = 0
      this.ovchgSt()
    },
    async actionSt () {
      console.log(this.action)
      MD.fD()
      this.action = 0
    },
    closeSt () {
      MD.fD()
      this.action = 0
    },
    ouvrirdetails () {
      this.session.setPeopleId(this.mb.na.id)
      MD.oD('detailspeople')
    },
    async editInfo () {
      if (await this.session.edit()) this.ovinfoedit()
    },
    async infook (info) {
      // TODO enregistrer le texte de commentaires
      console.log(info)
      MD.fD()
    },
    async changeMc (mc) {
      // TODO
      console.log(mc)
    }
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe
    const photoDef = stores.config.iconAvatar
 
    const infoedit = ref(false)
    function ovinfoedit () { MD.oD(infoedit) }
    const chgSt = ref(false)
    function ovchgSt () { MD.oD(chgSt) }

    return {
      MD, infoedit, ovinfoedit, chgSt, ovchgSt,
      session,
      gSt,
      photoDef
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 1px !important
  width: 1.5rem !important
</style>
