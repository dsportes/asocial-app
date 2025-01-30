<template>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated>
      <q-toolbar class="tbs">
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{!zombi ? $t('CHoch3', [cvI.nom, cvE.nom]) : $t('CHzombi')}}
        </q-toolbar-title>
        <bouton-help page="chat_maj"/>
      </q-toolbar>
      <q-toolbar inset v-if="!zombi" class="tbs">
        <div v-if="racE || racI || dispE" class="row q-gutter-sm">
          <div v-if="racE" class="msg">{{$t('CHraccroche2', [cvE.nom])}}</div>
          <div v-if="racI" class="msg">{{$t('CHraccroche')}}</div>
          <div v-if="dispE" class="msg2 titre-lg">{{$t('disparu')}}</div>
        </div>
        <div v-if="chatX.mutI" class="msg">{{$t('CHmutI', [cvE.nom, chatX.mutI === 2 ? 'A' : 'O'])}}</div>
        <div v-if="chatX.mutE" class="msg">{{$t('CHmutE', [cvE.nom, chatX.mutE === 2 ? 'A' : 'O'])}}</div>
      </q-toolbar>
      <div v-if="!zombi">
        <apercu-genx v-if="!dispE" class="bordb" :id="chatX.idE" :idx="0" />
        <div :class="sty() + 'q-pa-xs row q-gutter-xs items-center'">
          <btn-cond v-if="chatX.stE !== 2" :label="$t('CHadd1')" icon="add"
            @ok="editer(false)" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <btn-cond v-if="chatX.stE !== 2"  :label="$t('CHadd2')" icon="savings"
            @ok="editer(true)" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <btn-cond v-if="!racI" :label="$t('CHrac')" icon="phone_disabled" 
            @ok="raccrocher()" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <btn-cond v-if="id === session.compteId && chatX.stE !== 2"  :label="$t('CHmutb')" color="warning" icon="settings"
            @ok="ovMut()" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
        </div>
      </div>
    </q-header>

    <q-page-container>
      <q-card  v-if="!zombi" class="q-pa-sm">
        <div v-for="it in chatX.items" :key="it.dh + '/' + it.a">
          <q-chat-message :sent="it.a===0" 
            :bg-color="it.a ? 'primary' : 'secondary'"
            text-color="white">
            <div>
              <sd-blanc v-if="!it.dhx" :texte="it.t"/>
              <div :class="'text-italic q-mt-sm ' + (!it.dhx ? 'bordt' : '')">{{dhcool(it.dh)}}</div>
              <div v-if="it.dhx" class="msg">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            </div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <div class="row items-center q-gutter-xs">
                  <q-icon v-if="nonlu(it)" name="flag" color="warning" size="sm"/>
                  <span>{{it.a===0 ? $t('moi') : cvE.nom}}</span>
                </div>
                <btn-cond v-if="it.a===0 && !it.dhx" size="sm" icon="clear" color="warning"
                  @ok="effacer(it.dh)" 
                  :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Gestion des mutations -->
    <q-dialog v-model="ui.d[idc].mutation" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('CHmutit' + (session.compte.del ? 1 : 2))}}
          </q-toolbar-title>
          <bouton-help page="ht_mutation_oa"/>
        </q-toolbar>

        <q-card-section v-if="chatX.mutI" class="column items-center q-gutter-sm q-pa-md fs-md">
          <div class="titre-lg text-center">{{$t('CHmutI', [cvE.nom, chatX.mutI === 2 ? 'A' : 'O'])}}</div>
          <btn-cond :label="$t('CHmuts', [cvE.nom, chatX.mutI === 2 ? 'A' : 'O'])" 
            color="warning" icon="close" @ok="cfI = true"/>
          <bouton-confirm :actif="cfI" :confirmer="delMutI"/>
          <q-separator class="full-width" color="orange"/>
        </q-card-section>

        <q-card-section v-if="!chatX.mutI && session.estA" class="column items-center q-gutter-sm q-pa-md fs-md">
          <div class="titre-lg text-italic">{{$t('CHmutdm')}}</div>
          <div v-if="!stE.del" class="text-italic">{{$t('CHmutn1', [cvE.nom])}}</div>
          <div v-else class="column items-center q-gutter-sm">
            <btn-cond :label="$t('CHmutd', [cvE.nom, 'O'])" color="warning" icon="check"
              @ok="cfA = true"/>
            <bouton-confirm :actif="cfA" :confirmer="demMutO"/>
          </div>
          <q-separator class="full-width" color="orange"/>
        </q-card-section>

        <q-card-section v-if="!chatX.mutI && !session.estA && !session.estComptable" 
          class="column items-center q-gutter-sm q-pa-md fs-md">
          <div class="titre-lg text-italic">{{$t('CHmutdm')}}</div>
          <div v-if="!stE.del || stE.idp !== session.compte.idp" class="text-italic">{{$t('CHmutn2', [cvE.nom])}}</div>
          <div v-else class="column items-center q-gutter-sm">
            <btn-cond :label="$t('CHmutd', [cvE.nom, 'A'])" color="warning" icon="check"
              @ok="cfO = true"/>
            <bouton-confirm :actif="cfO" :confirmer="demMutA"/>
          </div>
          <q-separator class="full-width" color="orange"/>
        </q-card-section>

        <q-card-section v-if="session.compte.del && !chatX.mutE" class="column items-center q-gutter-sm q-pa-md fs-md"><!-- il est O -->
          <div class="titre-lg text-italic">{{$t('CHmutex')}}</div>
          <q-separator class="full-width" color="orange"/>
        </q-card-section>

        <q-card-section v-if="chatX.mutE === 2" class="column items-center q-gutter-sm q-pa-md fs-md"><!-- il est O -->
          <div class="titre-lg">{{$t('CHmutE', [cvE.nom, 'A'])}}</div>
          <div v-if="!session.compte.del" class="text-italic">>{{$t('CHmutr1')}}</div>
          <div v-if="session.compte.del && session.compte.idp !== stE.idp">{{$t('CHmutr2', [cvE.nom])}}</div>
          <btn-cond v-if="session.compte.del && session.compte.idp === stE.idp"
            :label="$t('CHaffcpta', [cvE.nom])" icon="savings" @ok="voirCompta"/>
          <btn-cond v-if="session.compte.del && session.compte.idp === stE.idp"
            :label="$t('CHmutx', [cvE.nom, 'A'])" color="warning" icon="check"
            @ok="ovdialmut('A')"/>
          <q-separator class="full-width" color="orange"/>
        </q-card-section>

        <q-card-section v-if="chatX.mutE === 1" class="column items-center q-gutter-sm q-pa-md fs-md"><!-- il est A -->
          <div class="titre-lg">{{$t('CHmutE', [cvE.nom, 'O'])}}</div>
          <div v-if="!session.compte.del" class="text-italic">>{{$t('CHmutr1')}}</div>
          <btn-cond v-if="session.compte.del"
            :label="$t('CHaffcpta', [cvE.nom])" icon="savings" @ok="voirCompta"/>
          <btn-cond v-if="session.compte.del"
            :label="$t('CHmutx', [cvE.nom, 'O'])" color="warning" icon="check"
            @ok="ovdialmut('O')"/>
          <q-separator class="full-width" color="orange"/>
        </q-card-section>

        <q-card-actions class="q-mt-sm" align="center">
          <btn-cond flat :label="$t('jailu')" @ok="ui.fD"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Mutation de type de compte en "type" -->
    <q-dialog v-model="ui.d[idc].BPmut" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="tbs">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('PPmuter' + type)}}</q-toolbar-title>
        </q-toolbar>

        <choix-quotas v-model="quotas"/>
        <div v-if="quotas.err" class="bg-yellow-5 text-bold text-black q-pa-xs">
          {{$t('PPquot')}}
        </div>

        <q-card-section>
          <div class="titre-md">{{$t('PPmutmc')}}</div>
          <editeur-md
            v-model="texte" :lgmax="250" modetxt editable mh="6rem"
            :texte="$t('PPmsg' + type, [session.compte.idp])"/>
        </q-card-section>

        <q-card-actions class="q-pa-xs q-mt-sm q-gutter-sm" align="center" vertical>
          <btn-cond icon="undo" flat :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond :disable="quotas.err !== ''" color="warning" icon="change_history" 
            cond="cUrgence" :label="$t('valider')" @ok="cf=true"/>
          <bouton-confirm :actif="cf" :confirmer="mutOA"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d[idc].ACconfirmeff">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHeffcf')" @ok="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation du raccrocher -->
    <q-dialog v-model="ui.d[idc].ACconfirmrac">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHrac2', [cvE.nom])}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="clear"
            :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHrac')" @ok="passifop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Affichage des compteurs de compta du compte "courant"-->
    <q-dialog v-model="ui.d[idc].BPcptdial" position="left" persistent>
      <q-layout container view="hHh lpR fFf" :class="styp('md')">
        <q-header elevated class="tbs">
          <q-toolbar>
            <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
            <q-toolbar-title class="titre-lg text-center q-mx-sm">
              {{$t('PTcompta', [cvE.nomC])}}</q-toolbar-title>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-card>
            <panel-compta style="margin:0 auto" :c="session.compta.compteurs"/>
          </q-card>
        </q-page-container>
      </q-layout>
    </q-dialog>
    
    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d[idc].ACchatedit">
      <q-card :class="styp('sm')">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd1')}}</q-toolbar-title>
          <bouton-help page="chat_maj"/>
        </q-toolbar>
        <q-toolbar v-if="avecDon" inset class="tbs">
          <q-toolbar-title class="row justify-center items-center q-gutter-md">
            <div v-if="stE.cpt">
              <div class="titre-md text-bold">{{$t('CHmdon')}}</div>
              <q-select :options="cfg.dons2" size="md" v-model="mdon" dense color="white"/>
              <q-checkbox class="titre-md text-bold" size="md" dense 
                left-label v-model="dconf" :label="$t('CHcdon')" />
            </div>
            <div v-else class="msg">{{$t('CHdoncpt')}}</div>
          </q-toolbar-title>
        </q-toolbar>
        <div v-if="avecDon && stE.cpt && (mdon + 2 > solde)" class="msg text-bold">{{$t('CHcred', [solde, mdon])}}</div>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="add" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('valider')"
            :disable="avecDon && stE.cpt && (mdon > solde + 2)"
            @ok="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  const $t = useI18n().t

  import { ref, computed, onUnmounted } from 'vue'

  import stores from '../stores/stores.mjs'

  import { styp, sty, dhcool, dkli, afficherDiag, $q } from '../app/util.mjs'
  import { GetPartition, GetSynthese, GetCompta, MajChat, PassifChat, 
    MutChat, StatutChatE, MuterCompteO, MuterCompteA, MajLectChat } from '../app/operations4.mjs'
  import { ID } from '../app/api.mjs'

  import SdBlanc from '../components/SdBlanc.vue'
  import EditeurMd from '../components/EditeurMd.vue'
  import ApercuGenx from '../components/ApercuGenx.vue'
  import BoutonHelp from '../components/BoutonHelp.vue'
  import BtnCond from '../components/BtnCond.vue'
  import BoutonConfirm from '../components/BoutonConfirm.vue'
  import PanelCompta from '../components/PanelCompta.vue'
  import ChoixQuotas from '../components/ChoixQuotas.vue'

  const props = defineProps({ 
    id: String, 
    ids: String,
    urgence: Boolean
  })

  const ui = stores.ui
  const idc = ui.getIdc() // ; onUnmounted(() => ui.closeVue(idc))
  const aSt = stores.avatar
  const session = stores.session
  const cfg = stores.config
  const pSt = stores.people

  const cfI = ref(false)
  const cfA = ref(false)
  const cfO = ref(false)
  const cf = ref(false)

  const chatX = computed(() => aSt.getChat(props.id, props.ids))
  const zombi = computed(() => !chatX.value )

  const estDel = computed(() => ID.estComptable(chatX.value.idE) || session.estDelegue)
  const cvE = computed(() => session.getCV(chatX.value.idE))
  const cvI = computed(() => session.getCV(chatX.value.id))
  const racI = computed(() => chatX.value.stI === 0)
  const racE = computed(() => chatX.value.stE === 0)
  const dispE = computed(() => chatX.value.stE === 2)
  const nonlu = (it) => (it.dhx ? it.dhx : it.dh) > chatX.value.dhLectChat

  const dconf = ref(false)
  const txt = ref('')
  const avecDon = ref(false)
  const mdon = ref(cfg.dons2[0])
  const dheff = ref(0)
  const solde = ref(0)
  const stE = ref(null)
  const type = ref()
  const texte = ref('')
  const quotas = ref()

  onUnmounted(async () => {
    if (session.accesNet && chatX.value.nonlu)
      await new MajLectChat().run(chatX.value)
    ui.closeVue(idc)
  })

  async function getStE () {
    stE.value = await new StatutChatE().run(chatX.value.ids)
  }

  async function effacer (dh) {
    dheff.value = dh
    ui.oD('ACconfirmeff', idc)
  }

  async function effop () {
    ui.fD()
    const disp = await new MajChat().run(chatX.value, null, dheff.value)
    if (disp) { await afficherDiag(this.$t('CHdisp')) }
    dheff.value = 0
  }

  async function addop () {
    ui.fD()
    const don = avecDon.value && stE.value.cpt ? mdon.value : 0
    const t = (don ? ($t('CHdonde', [don]) + '\n') : '') + txt.value
    const disp = await new MajChat().run(chatX.value, t, 0, don, props.urgence)
    if (disp) { await afficherDiag($t('CHdisp')) }
    txt.value = ''
  }

  async function passifop () {
    ui.fD()
    const suppr = await new PassifChat().run(chatX.value)
    if (suppr) { await afficherDiag($t('CHsuppr')) }
  }

  async function editer (avecD) {
    if (avecD) { 
      await getStE ()
      dconf.value = false
      await session.reloadCompta()
      solde.value = session.compta.compteurs.soldeCourant
      avecDon.value = true
    } else {
      avecDon.value = false
    }
    txt.value = chatX.value ? chatX.value.txt : ''
    ui.oD('ACchatedit', idc)
  }

  async function raccrocher () {
    txt.value = ''
    ui.oD('ACconfirmrac', idc)
  }

  async function ovMut () {
    await getStE()
    if (!stE.value || !stE.value.cpt) {
      await afficherDiag($t('CHmute'))
      return
    }
    cfI.value = false
    cfA.value = false
    cfO.value = false
    // console.log('ovMut', session.compte.del, chatX.value.mutE)
    this.ui.oD('mutation', idc)
  }

  async function delMutI () {
    ui.fD()
    await new MutChat().run(chatX.value, 0)
  }

  async function demMutA () {
    ui.fD()
    await new MutChat().run(chatX.value, 2)
  }

  async function demMutO () {
    ui.fD()
    await new MutChat().run(chatX.value, 1)
  }

  async function ovdialmut (t) {
    ui.fD()
    type.value = t
    cf.value = false
    texte.value = $t('PPmsg' + type.value, [session.compte.idp])
    await new GetCompta().run(chatX.value.idE, chatX.value.ids)
    if (t !== 'A') await new GetPartition().run(session.compte.idp)
    // pour le compte idE (pas pour l'exécutant) - Compta chargée
    quotas.value = t === 'A' ? await session.getQuotasA(session.compta.compteurs.qv) 
      : await session.getQuotasP(session.compta.compteurs.qv, true)
    ui.oD('BPmut', idc)
  }

  async function mutOA () {
    if (type.value === 'A')
      await new MuterCompteA().run(chatX.value, quotas.value, texte.value)
    else
      await new MuterCompteO().run(chatX.value, quotas.value, texte.value)
    await new GetPartition().run(session.compte.idp)
    await new GetSynthese().run()
    ui.fD()
  }

  async function voirCompta () { // comptable OU délégué
    await new GetCompta().run(chatX.value.idE, chatX.value.ids)
    ui.oD('BPcptdial', idc)
  }

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
.bordt
  border-top: 1px solid $grey-5
</style>
